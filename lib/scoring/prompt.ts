import type { Cap, Dimension, RubricPack } from "../rubric/types.ts";
import { SHARED_SCHEMA_NAME } from "../openrouter.ts";

/**
 * Prompt assembly.
 *
 * Two rules here are counter-intuitive and both come from measurement rather than taste.
 *
 * 1. NEVER write "be conservative", "only report high-severity", or "double-check your work".
 *    Opus 5 follows conservatism instructions literally and reports LESS — which is the exact
 *    opposite of what an evidence-gated scorer needs. Prompt for exhaustive enumeration and
 *    keep every conservative word in code, where it can be tested.
 *
 * 2. The anti-halo line goes on EVERY dimension prompt. Scoring each dimension in its own call
 *    removes cross-dimension halo but does nothing about tone halo within a dimension, and
 *    coaching-01 is a warm call by construction.
 */

const ANTI_HALO =
  "Warmth, rapport, likeability and client enthusiasm are NOT evidence for this dimension " +
  "unless the rubric text for it names them. A friendly call and a well-coached call are " +
  "different things, and only the second one scores.";

const EVIDENCE_CONTRACT =
  "Every quote must be copied VERBATIM from the transcript, at least 8 consecutive words, with " +
  "the line number it came from. Quotes are checked against the transcript afterwards, so an " +
  "approximate or reconstructed quote will simply fail. If a required behaviour did not occur, " +
  "return an empty evidence array for it — an empty array is a correct and expected answer.";

/**
 * The shared, cached prefix. Identical across every call in a run, which is what lets the
 * transcript be written to cache once per enum group instead of once per dimension.
 *
 * Nothing non-deterministic may appear here — no timestamp, no run id, no unsorted JSON. A
 * single varying byte drops the cache hit rate to zero and quintuples the input cost, with no
 * other visible symptom.
 */
export function buildPrefix(pack: RubricPack, numberedTranscript: string): string {
  return `You are scoring a ${pack.callType === "coaching" ? "coaching" : "kick-off"} call against a fixed rubric.

HOW THIS WORKS
- You will be asked about ONE dimension at a time. Score only the dimension you are asked about.
- ${ANTI_HALO}
- ${EVIDENCE_CONTRACT}
- Report what the transcript shows. Do not infer what probably happened off-recording.

WHAT THIS TRANSCRIPT CONTAINS
Speaking turns as "[Speaker Name]: text", one per line, line-numbered for citation. It also
carries inline non-verbal markers such as [laughs], [pause], [inaudible], [exertion],
[breathing] and [stepping] — these are real evidence and may be cited. A turn ending in a
mid-sentence dash indicates the speaker was cut off.

There are NO timestamps, so elapsed minutes cannot be determined from this transcript.

TRANSCRIPT (line-numbered):
${numberedTranscript}`;
}

/** One requirement rendered for the prompt. */
function renderRequirements(dim: Dimension): string {
  return dim.requirements
    .map((r) => `  ${r.id}  ${r.text}`)
    .join("\n");
}

function renderBuckets(dim: Dimension): string {
  return dim.buckets
    .map((b) => `  ${b.value}/${dim.maxPoints} — ${b.label}${b.sourceBand ? ` (band ${b.sourceBand})` : ""}\n      ${b.criteria}`)
    .join("\n");
}

/**
 * The per-dimension question. Short, because the expensive half is the cached prefix.
 *
 * Facts resolved by the fact pass are injected here as GIVEN PREMISES rather than re-derived.
 * Twelve dimension calls each voting on one global fact would disagree, and the tiebreak
 * between them would be arbitrary.
 */
export function buildQuestion(
  dim: Dimension,
  opts: { givenFacts?: string[]; priorOutcomes?: string[] } = {},
): string {
  const parts: string[] = [];

  parts.push(`SCORE DIMENSION ${dim.id} — ${dim.title} (out of ${dim.maxPoints})`);
  if (dim.pillar) parts.push(`Pillar: ${dim.pillar}`);
  parts.push("");
  parts.push(`WHAT TO LOOK FOR\n${dim.whatToLookFor}`);

  parts.push("");
  parts.push(
    "REQUIRED BEHAVIOURS — report on EACH one separately, by id.\n" +
    "For every id below, list every piece of verbatim evidence that it occurred. List an empty\n" +
    "array where it did not.\n\n" +
    "Counter-evidence is a NARROW category. Use it only where the transcript shows the behaviour\n" +
    "did NOT happen, or that it happened and was then reversed or walked back. Something merely\n" +
    "weaker, partial or less good than the rest of the call is NOT counter-evidence — that belongs\n" +
    "in your reasoning. Marking a behaviour contradicted removes the top score, so use it only\n" +
    "when the transcript genuinely points both ways.\n\n" +
    renderRequirements(dim),
  );

  parts.push("");
  parts.push(
    "SCORING TABLE — your score must be exactly one of these values.\n" +
    renderBuckets(dim) + "\n\n" +
    "HOW TO CHOOSE\n" +
    "The top bucket is conjunctive — it describes a call that did ALL of the required behaviours\n" +
    "listed above. Choose the highest value only if EVERY one of them is evidenced. If any is\n" +
    "missing, or is contradicted elsewhere in the call, choose a lower value and name the\n" +
    "behaviour that was missing.\n" +
    "Your reasoning, your score and your quick fix must agree with each other. Do not argue for\n" +
    "full marks and then pick a lower number, and never write \"already at full marks\" under a\n" +
    "score that is not full marks.",
  );

  if (dim.tiebreaks.length) {
    parts.push("");
    parts.push(`TIEBREAKS\n${dim.tiebreaks.map((t) => `  - ${t}`).join("\n")}`);
  }
  if (dim.calibrationNotes.length) {
    parts.push("");
    parts.push(`CALIBRATION\n${dim.calibrationNotes.map((c) => `  - ${c}`).join("\n")}`);
  }
  if (dim.listenFor.length) {
    parts.push("");
    parts.push(`PHRASES TO LISTEN FOR\n${dim.listenFor.map((l) => `  - ${l}`).join("\n")}`);
  }
  if (dim.positiveSignals.length) {
    parts.push("");
    parts.push(`POSITIVE SIGNALS\n${dim.positiveSignals.map((s) => `  - ${s}`).join("\n")}`);
  }
  if (dim.negativeSignals.length) {
    parts.push("");
    parts.push(`NEGATIVE SIGNALS\n${dim.negativeSignals.map((s) => `  - ${s}`).join("\n")}`);
  }
  if (dim.unobservable.length) {
    parts.push("");
    parts.push(
      `CANNOT BE DETERMINED FROM A TRANSCRIPT\n${dim.unobservable.map((u) => `  - ${u}`).join("\n")}\n` +
      `Do not count these against the coach and do not speculate about them.`,
    );
  }

  if (opts.givenFacts?.length) {
    parts.push("");
    parts.push(
      `ALREADY ESTABLISHED — treat these as settled fact. Do not re-litigate them.\n` +
      opts.givenFacts.map((f) => `  - ${f}`).join("\n"),
    );
  }

  if (opts.priorOutcomes?.length) {
    parts.push("");
    parts.push(
      `OUTCOMES OF THE OTHER DIMENSIONS ON THIS CALL\n` +
      opts.priorOutcomes.map((o) => `  - ${o}`).join("\n"),
    );
  }

  parts.push("");
  parts.push(
    `Then write your reasoning, opening with a reference to a specific moment in the transcript.\n` +
    `Then give the score. Then give the quick fix: what the coach would have had to do to reach\n` +
    `full marks on this dimension, phrased concretely enough to act on.`,
  );

  return parts.join("\n");
}

/**
 * The per-dimension JSON schema.
 *
 * Property order IS generation order under constrained decoding, so evidence is produced FIRST
 * and the score LAST. A score emitted first is one the evidence is then written to justify, and
 * the JSON still validates, so nothing downstream would ever catch it.
 *
 * The schema NAME is constant across every dimension on purpose: probe M2b established that the
 * name does not invalidate the prompt cache but the enum does. Varying only the enum means
 * dimensions that share one can share a warm transcript.
 */
export function buildSchema(dim: Dimension): Record<string, unknown> {
  const evidenceItem = {
    type: "object",
    properties: {
      quote: { type: "string" },
      line: { type: "number" },
      speaker: { type: "string" },
    },
    required: ["quote", "line", "speaker"],
    additionalProperties: false,
  };

  return {
    type: "json_schema",
    json_schema: {
      name: SHARED_SCHEMA_NAME,
      strict: true,
      schema: {
        type: "object",
        properties: {
          requirement_findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                requirement_id: { type: "string", enum: dim.requirements.map((r) => r.id) },
                evidence: { type: "array", items: evidenceItem },
                counter_evidence: { type: "array", items: evidenceItem },
              },
              required: ["requirement_id", "evidence", "counter_evidence"],
              additionalProperties: false,
            },
          },
          reasoning: { type: "string" },
          score: { type: "number", enum: dim.enum },
          quick_fix: { type: "string" },
        },
        required: ["requirement_findings", "reasoning", "score", "quick_fix"],
        additionalProperties: false,
      },
    },
  };
}

/** The fact pass schema — one enumeration per cap, resolved before any dimension is scored. */
export function buildFactSchema(caps: Cap[]): Record<string, unknown> {
  const evidenceItem = {
    type: "object",
    properties: {
      quote: { type: "string" },
      line: { type: "number" },
      speaker: { type: "string" },
    },
    required: ["quote", "line", "speaker"],
    additionalProperties: false,
  };

  return {
    type: "json_schema",
    json_schema: {
      name: "cap_facts",
      strict: true,
      schema: {
        type: "object",
        properties: {
          cap_findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                cap_id: { type: "string", enum: caps.map((c) => c.id) },
                supporting: { type: "array", items: evidenceItem },
                counter_evidence: { type: "array", items: evidenceItem },
                note: { type: "string" },
              },
              required: ["cap_id", "supporting", "counter_evidence", "note"],
              additionalProperties: false,
            },
          },
        },
        required: ["cap_findings"],
        additionalProperties: false,
      },
    },
  };
}

export function buildFactQuestion(caps: Cap[]): string {
  const enumerated = caps.filter((c) => c.resolution === "enumerated");
  return `Before any dimension is scored, resolve these factual questions about the call.

Each one asks you to ENUMERATE what is present. Where nothing is present, return an empty array —
that is a correct answer, not a failure. Do not judge, score, or interpret; just find and quote.

${enumerated.map((c, i) => `${i + 1}. [${c.id}]\n${c.enumerationPrompt}`).join("\n\n")}

For each, put supporting instances in "supporting". Put something in "counter_evidence" ONLY if it
reverses or walks back a supporting instance — not if it is merely weaker. Use "note" for anything
a reader would need to understand the finding.

${EVIDENCE_CONTRACT}`;
}
