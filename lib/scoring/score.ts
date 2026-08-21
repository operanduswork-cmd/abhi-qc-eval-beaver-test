import { callModel, type Effort } from "../openrouter.ts";
import { prepare, numbered } from "../transcript/canonicalise.ts";
import { parse, likelyCoach } from "../transcript/parse.ts";
import { talkShare, resolveThreshold } from "../transcript/talkshare.ts";
import { createVerifier, usable, type RawEvidence, type VerifiedEvidence } from "./evidence.ts";
import { buildPrefix, buildQuestion, buildSchema, buildFactSchema, buildFactQuestion } from "./prompt.ts";
import {
  computeTotal, resolveDimensionScore, requirementState,
  type CapOutcome, type DimensionOutcome, type RequirementOutcome, type TotalResult,
} from "./total.ts";
import { callOrder, type Cap, type CapDetermination, type Dimension, type RubricPack } from "../rubric/types.ts";

/**
 * The scorer.
 *
 * Order is load-bearing and is the whole design:
 *
 *   1. FACT PASS FIRST. The total caps belong to no dimension. Letting all twelve dimension
 *      calls emit cap signals would be twelve independently-sampled votes on one global fact;
 *      they would disagree and the tiebreak would be arbitrary. One pass resolves every cap
 *      predicate, and the results are injected into the dimension calls as GIVEN PREMISES.
 *   2. Twelve dimension calls, ORDERED BY ENUM GROUP so same-enum dimensions share a warm
 *      transcript cache (M2b), with D12 LAST because its negative signals are literally the
 *      other dimensions' outcomes.
 *   3. Every quote verified against the transcript. Only `not_found` retries.
 *   4. All arithmetic in code.
 */

export interface ScoreOptions {
  callType: "kickoff" | "coaching";
  transcript: string;
  coachName?: string;
  effort?: Effort;
  runId?: string;
  /**
   * Called once the fact pass returns and every cap is resolved.
   *
   * Cap outcomes are FINAL here — `computeTotal` reads caps, it never rewrites them — so a
   * caller may durably commit them. That commit is also the only evidence the ~30s fact pass
   * finished, which is what lets a progress screen tell "reading the call for facts" from
   * "no dimension has landed yet". Those are the same 0/12 and different truths.
   */
  onFacts?: (caps: ScoreResult["caps"]) => void | Promise<void>;
  /**
   * Called as each dimension lands, so a caller can commit it rather than waiting for all twelve.
   *
   * A single object rather than positional arguments: there is one production caller and four
   * positional args, three of them `number | string`, is where a caller eventually transposes two.
   */
  onProgress?: (ev: DimensionLanded) => void | Promise<void>;
}

export interface DimensionLanded {
  done: number;
  total: number;
  /**
   * Position in CALL order, which is NOT rubric order. `callOrder()` groups dimensions by score
   * enum so same-enum calls share a warm prompt cache, and forces D12 last because its negative
   * signals are the other dimensions' outcomes. Coaching runs D1 D2 D5 D3 D4 …, so an index into
   * `pack.dimensions` names the wrong dimension from the third call onward.
   */
  index: number;
  dimensionId: string;
  /**
   * PROVISIONAL. `computeTotal` has not run yet. Between here and the report:
   *   - resolveActiveSet may promote maxPoints AND scale score (D2 N/A -> D3 15 becomes 25)
   *   - applyDimensionCaps may clamp, or floor to 0 on a non-recoverable cap (D8, D10)
   * The top-bucket gate has already run — it lives inside resolveDimensionScore.
   *
   * A caller MUST overwrite this with the post-arithmetic value at the end of the run, and MUST
   * NOT render it as a score. See lib/run.ts execute().
   */
  provisional: DimensionResult;
}

export interface DimensionResult {
  id: string;
  title: string;
  score: number | null;
  maxPoints: number;
  bucketMatched: string | null;
  disabled: boolean;
  disabledReason: string | null;
  notEvidenced: boolean;
  /** The "the dimension says so" sentence, when there is something to say. */
  absenceStatement: string | null;
  reasoning: string;
  quickFix: string;
  evidence: VerifiedEvidence[];
  requirements: {
    id: string;
    text: string;
    state: ReturnType<typeof requirementState>;
    evidence: VerifiedEvidence[];
    counterEvidence: VerifiedEvidence[];
  }[];
  generationId: string | null;
  usage: { promptTokens: number; completionTokens: number; cachedTokens: number; cost: number };
}

export interface ScoreResult {
  callType: "kickoff" | "coaching";
  coach: string;
  client: string;
  transcriptSha256: string;
  dimensions: DimensionResult[];
  caps: (CapOutcome & { statement: string | null; supporting: VerifiedEvidence[]; counterEvidence: VerifiedEvidence[] })[];
  total: TotalResult;
  talkShare: ReturnType<typeof talkShare>;
  cost: number;
  /**
   * False when any call failed. A partial run must never be presented as a finished score:
   * the brief's "a failed run says why" applies to a run that half-worked just as much as one
   * that died outright.
   */
  ok: boolean;
  failures: string[];
}

const MAX_RETRY = 1;

export async function scoreTranscript(pack: RubricPack, opts: ScoreOptions): Promise<ScoreResult> {
  const canonical = prepare(opts.transcript);
  const parsed = parse(canonical.body);
  const coach = opts.coachName ?? likelyCoach(parsed) ?? parsed.speakers[0] ?? "";
  const shares = talkShare(parsed, coach);
  const verifier = createVerifier(canonical.body, parsed);
  const prefix = buildPrefix(pack, numbered(canonical.body));
  const failures: string[] = [];
  let cost = 0;

  const verifyAll = (raw: RawEvidence[] | undefined): VerifiedEvidence[] =>
    verifier.verifyAll(raw ?? []);

  // ---------------------------------------------------------------- 1. facts
  const enumerated = pack.caps.filter((c) => c.resolution === "enumerated");
  const factRes = await callModel<{ cap_findings: { cap_id: string; supporting: RawEvidence[]; counter_evidence: RawEvidence[]; note: string }[] }>({
    prefix,
    question: buildFactQuestion(pack.caps),
    schema: buildFactSchema(enumerated),
    effort: opts.effort ?? "low",
    maxTokens: 8000,
    ...(opts.runId ? { sessionId: opts.runId } : {}),
  });
  cost += factRes.usage.cost;
  if (!factRes.ok) failures.push(`fact pass failed: ${factRes.error}`);

  const capOutcomes = resolveCaps(pack.caps, factRes.data?.cap_findings ?? [], verifyAll, shares, factRes.ok);
  await opts.onFacts?.(capOutcomes);

  const givenFacts = capOutcomes
    .filter((c) => c.determination !== "not_fired")
    .map((c) => `${capLabel(pack.caps, c.id)} — ${c.determination.replace("_", " ")}. ${c.statement ?? ""}`.trim());

  // ------------------------------------------------------ 2. dimensions
  const order = callOrder(pack);
  const byId = new Map(pack.dimensions.map((d) => [d.id, d]));
  const results: DimensionResult[] = [];
  const priorOutcomes: string[] = [];

  for (const [i, id] of order.entries()) {
    const dim = byId.get(id)!;
    const res = await scoreOne(dim, {
      prefix, verifyAll, givenFacts,
      // D12 alone is told what everything else scored.
      priorOutcomes: id === "D12" ? priorOutcomes : [],
      effort: opts.effort ?? "low",
      ...(opts.runId ? { runId: opts.runId } : {}),
      capOutcomes,
    });
    cost += res.usage.cost;
    if (res.reasoning === "") failures.push(`${id} produced no result`);
    results.push(res);
    priorOutcomes.push(`${id} ${dim.title}: ${res.score ?? "N/A"}/${res.maxPoints}`);
    await opts.onProgress?.({
      done: i + 1, total: order.length, index: i, dimensionId: id, provisional: res,
    });
  }

  // restore rubric order for the report
  results.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));

  // -------------------------------------------------------- 3. arithmetic
  const outcomes: DimensionOutcome[] = results.map((r) => ({
    id: r.id,
    score: r.score,
    maxPoints: r.maxPoints,
    disabled: r.disabled,
    ...(r.disabledReason ? { disabledReason: r.disabledReason } : {}),
    notEvidenced: r.notEvidenced,
  }));
  const total = computeTotal(outcomes, capOutcomes, pack.callType);

  return {
    callType: pack.callType,
    coach,
    client: parsed.speakers.find((s) => s !== coach) ?? "",
    transcriptSha256: canonical.sha256,
    dimensions: results,
    caps: capOutcomes,
    total,
    talkShare: shares,
    cost,
    ok: failures.length === 0,
    failures,
  };
}

// ---------------------------------------------------------------------------

async function scoreOne(
  dim: Dimension,
  ctx: {
    prefix: string;
    verifyAll: (r: RawEvidence[] | undefined) => VerifiedEvidence[];
    givenFacts: string[];
    priorOutcomes: string[];
    effort: Effort;
    runId?: string;
    capOutcomes: CapOutcome[];
  },
): Promise<DimensionResult> {
  const empty = (msg: string): DimensionResult => ({
    id: dim.id, title: dim.title, score: null, maxPoints: dim.maxPoints, bucketMatched: null,
    disabled: false, disabledReason: null, notEvidenced: true, absenceStatement: msg,
    reasoning: "", quickFix: "", evidence: [], requirements: [], generationId: null,
    usage: { promptTokens: 0, completionTokens: 0, cachedTokens: 0, cost: 0 },
  });

  let res = await callModel<DimensionPayload>({
    prefix: ctx.prefix,
    question: buildQuestion(dim, { givenFacts: ctx.givenFacts, priorOutcomes: ctx.priorOutcomes }),
    schema: buildSchema(dim),
    effort: ctx.effort,
    maxTokens: 8000,
    ...(ctx.runId ? { sessionId: ctx.runId } : {}),
  });

  let verified = verifyPayload(dim, res.data, ctx.verifyAll);

  // Bounded retry, and ONLY for quotes that were not found at all. A location mismatch is
  // accepted and corrected; a short quote needs a different instruction, not another attempt.
  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    const missing = verified.flatMap((r) => [...r.evidence, ...r.counterEvidence])
      .filter((e) => e.status === "not_found");
    if (!res.ok || missing.length === 0) break;

    const retry = await callModel<DimensionPayload>({
      prefix: ctx.prefix,
      question:
        buildQuestion(dim, { givenFacts: ctx.givenFacts, priorOutcomes: ctx.priorOutcomes }) +
        `\n\nA previous attempt cited ${missing.length} quote(s) that do not appear in the ` +
        `transcript, including: ${missing.slice(0, 3).map((m) => JSON.stringify(m.quote.slice(0, 60))).join(", ")}. ` +
        `Copy quotes character-for-character from the transcript above. If a behaviour is not ` +
        `there, return an empty array for it rather than reconstructing a quote.`,
      schema: buildSchema(dim),
      effort: ctx.effort,
      maxTokens: 8000,
      ...(ctx.runId ? { sessionId: ctx.runId } : {}),
    });
    if (retry.ok && retry.data) {
      const retried = verifyPayload(dim, retry.data, ctx.verifyAll);
      const before = missing.length;
      const after = retried.flatMap((r) => [...r.evidence, ...r.counterEvidence]).filter((e) => e.status === "not_found").length;
      if (after < before) { res = retry; verified = retried; }
    }
    break;
  }

  if (!res.ok || !res.data) return empty(`Could not be scored: ${res.error ?? "no response"}`);

  const requirementOutcomes: RequirementOutcome[] = verified.map((r) => ({
    requirementId: r.id,
    verifiedCount: usable(r.evidence).length,
    counterCount: usable(r.counterEvidence).length,
    ...(dim.unobservable.length && r.id === dim.requirements.at(-1)?.id ? {} : {}),
  }));

  const resolved = resolveDimensionScore(
    { id: dim.id, maxPoints: dim.maxPoints, defaultWhenAbsent: dim.defaultWhenAbsent, enum: dim.enum },
    res.data.score,
    requirementOutcomes,
  );

  const bucket = dim.buckets.find((b) => b.value === resolved.score);

  return {
    id: dim.id,
    title: dim.title,
    score: resolved.score,
    maxPoints: dim.maxPoints,
    bucketMatched: bucket?.label ?? null,
    disabled: false,
    disabledReason: null,
    notEvidenced: resolved.notEvidenced,
    absenceStatement: resolved.statement,
    reasoning: res.data.reasoning,
    quickFix: res.data.quick_fix,
    evidence: verified.flatMap((r) => r.evidence),
    requirements: verified.map((r) => ({
      id: r.id,
      text: dim.requirements.find((x) => x.id === r.id)?.text ?? r.id,
      state: requirementState({ requirementId: r.id, verifiedCount: usable(r.evidence).length, counterCount: usable(r.counterEvidence).length }),
      evidence: r.evidence,
      counterEvidence: r.counterEvidence,
    })),
    generationId: res.generationId,
    usage: {
      promptTokens: res.usage.promptTokens,
      completionTokens: res.usage.completionTokens,
      cachedTokens: res.usage.cachedTokens,
      cost: res.usage.cost,
    },
  };
}

interface DimensionPayload {
  requirement_findings: { requirement_id: string; evidence: RawEvidence[]; counter_evidence: RawEvidence[] }[];
  reasoning: string;
  score: number;
  quick_fix: string;
}

function verifyPayload(
  dim: Dimension,
  data: DimensionPayload | null,
  verifyAll: (r: RawEvidence[] | undefined) => VerifiedEvidence[],
) {
  // Every requirement appears in the output, whether the model mentioned it or not. A
  // requirement the model silently skipped is an absence, and absence must be reported.
  return dim.requirements.map((req) => {
    const found = data?.requirement_findings?.find((f) => f.requirement_id === req.id);
    return {
      id: req.id,
      evidence: verifyAll(found?.evidence),
      counterEvidence: verifyAll(found?.counter_evidence),
    };
  });
}

function capLabel(caps: Cap[], id: string): string {
  return caps.find((c) => c.id === id)?.condition ?? id;
}

/**
 * Resolve every cap. Arithmetic caps never touch the model — talk-share is computed from word
 * counts and bounded across a plausible speaking-rate range, with a published tie-break rule.
 */
function resolveCaps(
  caps: Cap[],
  findings: { cap_id: string; supporting: RawEvidence[]; counter_evidence: RawEvidence[]; note: string }[],
  verifyAll: (r: RawEvidence[] | undefined) => VerifiedEvidence[],
  shares: ReturnType<typeof talkShare>,
  factPassSucceeded: boolean,
) {
  return caps.map((cap) => {
    if (cap.resolution === "arithmetic") {
      const t = resolveThreshold(shares, cap.threshold ?? 0.75);
      return {
        id: cap.id,
        determination: t.verdict as CapDetermination,
        scope: cap.scope,
        target: cap.target,
        clamp: cap.clamp,
        nonRecoverable: cap.nonRecoverable,
        statement: t.statement,
        supporting: [] as VerifiedEvidence[],
        counterEvidence: [] as VerifiedEvidence[],
      };
    }

    // An empty enumeration means "fired" ONLY when the enumeration actually ran. If the fact
    // pass failed, nothing was looked for, and "we did not look" must never be reported as
    // "it is not there" — that turns an outage into a maximum penalty.
    if (!factPassSucceeded) {
      return {
        id: cap.id,
        determination: "indeterminate" as CapDetermination,
        scope: cap.scope,
        target: cap.target,
        clamp: cap.clamp,
        nonRecoverable: cap.nonRecoverable,
        statement:
          "The fact pass did not complete, so this condition was never checked. Recorded as " +
          "indeterminate and NOT applied - an unrun check is not a finding.",
        supporting: [] as VerifiedEvidence[],
        counterEvidence: [] as VerifiedEvidence[],
      };
    }

    const f = findings.find((x) => x.cap_id === cap.id);
    const supporting = verifyAll(f?.supporting);
    const counter = verifyAll(f?.counter_evidence);
    const s = usable(supporting).length;
    const c = usable(counter).length;

    // Three states. A boolean cannot describe coaching-01, where a time is agreed at L188 and
    // walked back at L193.
    let determination: CapDetermination;
    let statement: string;

    if (s > 0 && c > 0) {
      determination = "indeterminate";
      statement =
        `Both supporting and contradicting evidence exist, so this cannot be settled from the ` +
        `transcript. The cap is NOT applied and the call is scored on the branch where it does ` +
        `not fire. Supporting: ${quoteList(supporting)}. Contradicting: ${quoteList(counter)}.`;
    } else if (cap.enumerates === "firing_case") {
      // This enumeration lists the cap FIRING directly (a struggle that was ignored, confusion
      // left unresolved). Finding instances means it fires; finding none means it does not.
      determination = s > 0 ? "fired" : "not_fired";
      statement = s > 0
        ? `Found ${s} instance(s) where this condition holds, so the cap applies. ${quoteList(supporting)}`
        : `No instances found, so this condition does not hold and the cap does not apply.` +
          `${f?.note ? ` ${f.note}` : ""}`;
    } else if (s > 0) {
      // This enumeration lists the case where the condition does NOT hold, so instances of it
      // defeat the cap.
      determination = "not_fired";
      statement = `Found ${s} instance(s), so this condition does not hold. ${quoteList(supporting)}`;
    } else {
      determination = "fired";
      statement =
        `Not evidenced in the transcript: no instances found, so this condition holds and the ` +
        `cap applies.${f?.note ? ` ${f.note}` : ""}`;
    }

    return {
      id: cap.id,
      determination,
      scope: cap.scope,
      target: cap.target,
      clamp: cap.clamp,
      nonRecoverable: cap.nonRecoverable,
      statement,
      supporting,
      counterEvidence: counter,
    };
  });
}

function quoteList(evs: VerifiedEvidence[]): string {
  return usable(evs).slice(0, 3).map((e) => `L${e.line} "${e.exact.slice(0, 80)}"`).join(" · ");
}
