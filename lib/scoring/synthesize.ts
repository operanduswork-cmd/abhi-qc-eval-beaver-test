import { callModel, type Effort } from "../openrouter.ts";
import { createVerifier, usable, type RawEvidence, type VerifiedEvidence } from "./evidence.ts";
import { projectWith, type DimensionOutcome } from "./total.ts";
import type { ScoreResult } from "./score.ts";
import type { Parsed } from "../transcript/parse.ts";

/**
 * The three report items the scorer did not previously emit: the one thing, the brief, and the
 * red flags. `lib/report/contract.ts` names them; until this landed the page read them from a
 * hand-written `fixtures/report-copy/<run>.json`.
 *
 * One extra call per run, made AFTER scoring, with the finished dimension results in front of
 * it. That ordering matters: "the single change that moves the number most" is a question about
 * the scores, not about the transcript, and asking it before the scores exist would be asking
 * for a guess.
 *
 * THE COUNTERFACTUAL IS NEVER ASKED FOR. The model nominates which dimension to lift and to
 * what; the resulting total is recomputed in code via projectWith(). A model-authored "would
 * have scored 84" disagrees with the arithmetic on the same page roughly as often as it agrees,
 * and the page shows both.
 */

export interface Synthesis {
  oneThing: { text: string; dimensionId: string; wouldScore: number } | null;
  brief: string | null;
  redFlags: { severity: "HIGH" | "MEDIUM" | "LOW"; text: string; line: number }[] | null;
  /** Recomputed in code from oneThing.wouldScore. Never taken from the model. */
  projectedTotal: number | null;
  cost: number;
  error: string | null;
}

interface Payload {
  brief: string;
  red_flags: { severity: "HIGH" | "MEDIUM" | "LOW"; text: string; quote: string; line: number }[];
  one_thing_dimension: string;
  one_thing_would_score: number;
  one_thing: string;
}

function schemaFor(result: ScoreResult, liftable: { id: string; enum: number[] }[]) {
  return {
    type: "json_schema",
    json_schema: {
      name: "report_synthesis",
      strict: true,
      schema: {
        type: "object",
        // Order matters as everywhere else: the observations come before the recommendation.
        properties: {
          brief: { type: "string" },
          red_flags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                severity: { type: "string", enum: ["HIGH", "MEDIUM", "LOW"] },
                text: { type: "string" },
                quote: { type: "string" },
                line: { type: "number" },
              },
              required: ["severity", "text", "quote", "line"],
              additionalProperties: false,
            },
          },
          one_thing_dimension: { type: "string", enum: liftable.map((d) => d.id) },
          one_thing_would_score: { type: "number", enum: [...new Set(liftable.flatMap((d) => d.enum))].sort((a, b) => b - a) },
          one_thing: { type: "string" },
        },
        required: ["brief", "red_flags", "one_thing_dimension", "one_thing_would_score", "one_thing"],
        additionalProperties: false,
      },
    },
  };
}

export async function synthesize(
  result: ScoreResult,
  canonicalBody: string,
  parsed: Parsed,
  opts: { effort?: Effort; runId?: string; prefix: string } = { prefix: "" },
): Promise<Synthesis> {
  const verifier = createVerifier(canonicalBody, parsed);

  // Only dimensions that are actually scored and not already at their maximum can be "the one
  // thing" — recommending a change to a dimension already at full marks is noise.
  const liftable = result.dimensions
    .filter((d) => !d.disabled && d.score !== null && d.score < d.maxPoints)
    .map((d) => ({ id: d.id, enum: [d.maxPoints] }));

  if (liftable.length === 0) {
    return { oneThing: null, brief: null, redFlags: null, projectedTotal: null, cost: 0, error: null };
  }

  const summary = result.dimensions
    .map((d) => {
      const score = d.disabled ? "not scored" : `${d.score}/${d.maxPoints}`;
      const missing = d.requirements.filter((r) => r.state === "not_evidenced").map((r) => r.text);
      return `${d.id} ${d.title}: ${score}${missing.length ? `\n    not evidenced: ${missing.join(" | ")}` : ""}\n    ${d.reasoning}`;
    })
    .join("\n\n");

  const firedCaps = result.caps
    .filter((c) => c.determination !== "not_fired")
    .map((c) => `${c.id} — ${c.determination}: ${c.statement}`)
    .join("\n");

  const question = `The twelve dimensions have already been scored. Write the three parts of the report that
sit above them. Do not re-score anything.

SCORES AND REASONING
${summary}

CAPS
${firedCaps || "none fired"}

TOTAL: ${result.total.rawTotal}/${result.total.maxPossible} = ${result.total.normalizedTotal}/100 ${result.total.band.name}
Coach: ${result.coach}. Client: ${result.client}.

WRITE THREE THINGS

1. "brief" — a few sentences to the coach on how the call went. Address them by name, in the
   second person. Say what worked before what did not. It should read like a colleague who
   listened to the call, not like a summary of a scorecard.

2. "red_flags" — what puts this CLIENT at risk of leaving, and why. Not a list of low scores: a
   good-looking score can still hide one, and a low score on a minor dimension may not be a risk
   at all. Each needs a verbatim quote of at least 8 words from the transcript and its line
   number. Return an empty array if the call genuinely carries no retention risk.

3. "one_thing" — the single change that would move the number most, as one imperative sentence
   to the coach. Name the dimension it lifts in "one_thing_dimension" and the score that
   dimension would reach in "one_thing_would_score". Do NOT state a new total; it is computed
   from those two fields.

Every quote is checked against the transcript afterwards, so copy them character-for-character.`;

  const res = await callModel<Payload>({
    prefix: opts.prefix,
    question,
    schema: schemaFor(result, liftable),
    effort: opts.effort ?? "low",
    maxTokens: 4000,
    ...(opts.runId ? { sessionId: opts.runId } : {}),
  });

  if (!res.ok || !res.data) {
    return { oneThing: null, brief: null, redFlags: null, projectedTotal: null, cost: res.usage.cost, error: res.error };
  }

  // Red-flag lines go through the same verifier as evidence: the line is DERIVED from where the
  // quote actually sits, never trusted from the model. A red flag pointing at the wrong line is
  // the same defect as a dimension citing the wrong line, and it reads worse.
  const redFlags = res.data.red_flags
    .map((f) => {
      const v: VerifiedEvidence = verifier.verify({ quote: f.quote, line: f.line });
      return usable([v]).length ? { severity: f.severity, text: f.text, line: v.line! } : null;
    })
    .filter((f): f is { severity: "HIGH" | "MEDIUM" | "LOW"; text: string; line: number } => f !== null);

  // The counterfactual, computed.
  const outcomes: DimensionOutcome[] = result.dimensions.map((d) => ({
    id: d.id, score: d.score, maxPoints: d.maxPoints, disabled: d.disabled, notEvidenced: d.notEvidenced,
  }));
  const capOutcomes = result.caps.map((c) => ({
    id: c.id, determination: c.determination, scope: c.scope,
    target: c.target, clamp: c.clamp, nonRecoverable: c.nonRecoverable,
  }));
  const projected = projectWith(outcomes, capOutcomes, result.callType, res.data.one_thing_dimension);

  const target = result.dimensions.find((d) => d.id === res.data!.one_thing_dimension);

  return {
    oneThing: {
      text: res.data.one_thing,
      dimensionId: res.data.one_thing_dimension,
      // The dimension's own maximum, not the model's number — they should agree, and where they
      // do not the rubric wins.
      wouldScore: target?.maxPoints ?? res.data.one_thing_would_score,
    },
    brief: res.data.brief,
    redFlags,
    projectedTotal: projected.normalizedTotal,
    cost: res.usage.cost,
    error: null,
  };
}

/** Raw evidence shape, re-exported so callers do not need the evidence module directly. */
export type { RawEvidence };
