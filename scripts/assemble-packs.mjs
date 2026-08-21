// Assemble lib/rubric/{coaching,kickoff}.ts from the audited compilation output.
//
// Not a one-off: re-runnable, so a correction to the source data regenerates both packs
// identically. Every transformation applied here is recorded in lib/rubric/compile-notes.md.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = JSON.parse(readFileSync(join(ROOT, ".scratch", "scratch-packs.json"), "utf8"));

// ---------------------------------------------------------------------------
// D-03a — the top band must always contribute its CEILING as well as its floor.
//
// The compiler correctly applied D-03 as originally stated and produced
// kickoff D5 = [9,8,6,3,1,0]: its Elite band is 9-10 and names no tiebreak, so the rule took
// the floor. But that makes 10/10 unreachable and caps the whole instrument at 99/100.
// Principle #4's "score in the lower tier" governs uncertainty when evidence is missing; it was
// never meant to make a flawless call unattainable.
const D03A = { kickoff: { D5: [10, 9, 8, 6, 3, 1, 0] } };

// ---------------------------------------------------------------------------
// The observability correction.
//
// The compiling agents populated `unobservable` from the same false premises the research
// carried, and the adversarial audit caught it on nearly every dimension. Verified against the
// fixtures: 42 non-verbal markers exist ([exertion] x3, [breathing] x2, [stepping] x4,
// [shuffling] x2, [pause] x3, [laughs] x20, [inaudible] x8); turns are NOT strictly alternating
// (8 same-speaker continuations across 3 of 4 files); and interruption is explicitly
// acknowledged at coaching-02 L243/L244.
//
// So: drop every compiled entry, and add back only what survives a grep. Exactly one does.
const UNSCOREABLE = {
  coaching: {
    D12: [
      "The SOP minute allocations this dimension references cannot be measured: the transcript " +
      "carries no timestamps of any kind (verified: zero across all four fixtures). Pacing is " +
      "scored from a documented words-and-turns-per-section proxy, and the report says so " +
      "rather than implying the minutes were checked.",
    ],
  },
  kickoff: {},
};

// Audit found these dropped during compilation. Verbatim from the source cap tables.
const MISSING_TIEBREAKS = {
  coaching: {
    D3: ["Global auto-cap: No connection to long-term vision at any point in the call -> Max 10/15 on D3"],
  },
  kickoff: {},
};

// ---------------------------------------------------------------------------
// The two dimensions the rubric lets off scoring entirely. Verbatim from the source.
//
// These were dropped on the first assembly pass because `optional` was missing from the
// compiler's output schema, which left nothing able to decide D4 was disabled and silently
// broke the coaching-02 eval target.
const OPTIONAL = {
  coaching: {
    D2: {
      disableWhen:
        "If diagnostics not applicable this cycle (non-milestone call, no video submitted), " +
        "note this and score N/A - redistribute weight to D3 and D4. Do not penalize the coach.",
      detectionCriteria: [
        "Non-milestone call - diagnostics are not due this cycle.",
        "No video was submitted for review.",
      ],
      disabledBand: "N/A",
      redistributeTo: ["D3", "D4"],
    },
    D4: {
      disableWhen:
        "Optional dimension - disable when no movement coaching occurred. If the coach and " +
        "client did not engage in any live movement coaching during this call, set disabled: " +
        'true, a short disabled reason, and score: null with band: "N/A".',
      // The FOUR numbered criteria, normative over the five-item prose list.
      detectionCriteria: [
        "Client performed any live movement during the call.",
        "Coach gave setup, breathing, or control cues in response to a movement.",
        "There was a video review of a recorded movement attempt with real-time feedback.",
        "Coach gave real-time form correction while the client moved.",
      ],
      disabledBand: "N/A",
      redistributeTo: [],
    },
  },
  kickoff: {},
};

// ---------------------------------------------------------------------------
/**
 * Split a bucket's criteria cell into atomic requirements — one per sentence.
 *
 * Sentence granularity is the right unit here because the rubrics are written that way:
 * coaching D1 Elite is five sentences and five genuinely separate behaviours. Splitting is
 * done at compile time, not per run, so the requirement list is identical on every run —
 * which is half of what makes the output reproducible.
 */
function toRequirements(dimId, bucket) {
  if (!bucket) return [];
  const parts = [];
  let buf = "";
  let depth = 0; // don't split inside a parenthetical or a quotation

  for (let i = 0; i < bucket.criteria.length; i++) {
    const ch = bucket.criteria[i];
    if (ch === "(" || ch === "“") depth++;
    if (ch === ")" || ch === "”") depth = Math.max(0, depth - 1);
    buf += ch;

    const next = bucket.criteria[i + 1];
    const after = bucket.criteria[i + 2];
    const endsSentence = ch === "." && (next === undefined || (next === " " && /[A-Z"“]/.test(after ?? "")));
    if (endsSentence && depth === 0) { parts.push(buf.trim()); buf = ""; }
  }
  if (buf.trim()) parts.push(buf.trim());

  return parts
    .map((s) => s.trim())
    .filter((s) => s.length > 12) // drop fragments like "No." that are not behaviours
    .map((text, i) => ({ id: `${dimId}.r${i + 1}`, text, fromBucket: bucket.label }));
}

function build(callType, dims) {
  return dims.map((d) => {
    const enumValues = D03A[callType]?.[d.id] ?? d.enumValues;
    const buckets = [...d.buckets].sort((a, b) => b.value - a.value);

    // D-03a can add a value with no bucket row of its own; it reuses the top band's criteria.
    for (const v of enumValues) {
      if (!buckets.some((b) => b.value === v)) {
        const top = buckets[0];
        buckets.unshift({ value: v, label: top.label, criteria: top.criteria, sourceBand: top.sourceBand ?? "" });
      }
    }
    buckets.sort((a, b) => b.value - a.value);

    return {
      id: d.id,
      title: d.title,
      maxPoints: d.maxPoints,
      pillar: d.pillar || undefined,
      scoringMode: d.scoringMode,
      enum: enumValues,
      buckets,
      requirements: toRequirements(d.id, buckets[0]),
      whatToLookFor: d.whatToLookFor,
      tiebreaks: [...d.tiebreaks, ...(MISSING_TIEBREAKS[callType]?.[d.id] ?? [])],
      positiveSignals: d.positiveSignals,
      negativeSignals: d.negativeSignals,
      calibrationNotes: d.calibrationNotes,
      listenFor: d.listenFor,
      unobservable: UNSCOREABLE[callType]?.[d.id] ?? [],
      optional: OPTIONAL[callType]?.[d.id] ?? undefined,
      defaultWhenAbsent: d.defaultWhenAbsent,
      cappedBy: [],
    };
  });
}

const CAP_TARGETS = {
  coaching: { D10: ["coaching-cap-booking"], D3: ["coaching-cap-vision"], D6: ["coaching-cap-accountability"], D8: ["coaching-cap-struggle"] },
  kickoff: { D4: ["kickoff-cap-northstar"], D11: ["kickoff-cap-recap"] },
};

const ARITHMETIC_NOTES = {
  coaching: [
    "The twelve dimensions sum to 105 while the document states the total is 100. Results are " +
    "reported on the 100 scale by normalising against the true sum of active maxima - the same " +
    "mechanism the document itself specifies for the D4-disabled case.",
    "The document states 85 as the total when D4 is disabled, but its other eleven dimensions " +
    "sum to 90. The stated figure is arithmetically wrong; 90 is used and this note is shown.",
    "D4's disable block lists FIVE exclusions in prose but only FOUR in its numbered 'ALL four " +
    "must be absent' detection list, omitting 'no in-call demonstration'. The four numbered " +
    "criteria are treated as normative.",
  ],
  kickoff: [
    "The twelve dimensions sum to exactly 100, so no normalisation is applied.",
    "D11 carries a cap inside its own criteria rather than in the global cap table: no " +
    "structured recap -> max 3/5.",
  ],
};

function emit(callType, dims) {
  const capsImport = callType === "coaching" ? "COACHING_CAPS" : "KICKOFF_CAPS";
  const name = callType === "coaching" ? "COACHING_PACK" : "KICKOFF_PACK";
  const withCaps = dims.map((d) => ({ ...d, cappedBy: CAP_TARGETS[callType]?.[d.id] ?? [] }));

  const header = `// GENERATED by scripts/assemble-packs.mjs — do not edit by hand.
// Source: the two rubrics in fixtures/rubrics/, compiled and adversarially audited.
// Every judgement made during compilation is recorded in lib/rubric/compile-notes.md.
//
// Criteria strings are VERBATIM from the source tables. The model reads the rubric's own words,
// never a paraphrase.

import type { RubricPack } from "./types.ts";
import { ${capsImport} } from "./caps.ts";

export const ${name}: RubricPack = {
  callType: "${callType}",
  caps: ${capsImport},
  arithmeticNotes: ${JSON.stringify(ARITHMETIC_NOTES[callType], null, 2).replace(/\n/g, "\n  ")},
  scoringPrinciples: ${JSON.stringify(dims[0]?.tiebreaks?.slice(0, 0) ?? [], null, 2)},
  dimensions: ${JSON.stringify(withCaps, null, 2).replace(/\n/g, "\n  ")},
};

export default ${name};
`;
  writeFileSync(join(ROOT, "lib", "rubric", `${callType}.ts`), header);
  return withCaps;
}

mkdirSync(join(ROOT, "lib", "rubric"), { recursive: true });
const coaching = emit("coaching", build("coaching", src.coaching));
const kickoff = emit("kickoff", build("kickoff", src.kickoff));

const sum = (ds) => ds.reduce((a, d) => a + d.maxPoints, 0);
console.log(`coaching: ${coaching.length} dims, maxima sum ${sum(coaching)} (expected 105)`);
console.log(`kickoff:  ${kickoff.length} dims, maxima sum ${sum(kickoff)} (expected 100)`);
console.log(`requirements: coaching ${coaching.reduce((a, d) => a + d.requirements.length, 0)}, kickoff ${kickoff.reduce((a, d) => a + d.requirements.length, 0)}`);
for (const [label, ds] of [["coaching", coaching], ["kickoff", kickoff]]) {
  const groups = new Set(ds.map((d) => d.enum.join(",")));
  const unreachable = ds.filter((d) => Math.max(...d.enum) !== d.maxPoints);
  console.log(`${label}: ${groups.size} enum groups; unreachable maxima: ${unreachable.map((d) => `${d.id}(max ${d.maxPoints}, top ${Math.max(...d.enum)})`).join(", ") || "none"}`);
}
