import { test } from "node:test";
import assert from "node:assert/strict";

import {
  computeTotal, projectWith, resolveActiveSet,
  type CapOutcome, type DimensionOutcome,
} from "../lib/scoring/total.ts";

const COACHING_MAX: Record<string, number> = {
  D1: 10, D2: 10, D3: 15, D4: 15, D5: 10, D6: 15,
  D7: 5, D8: 5, D9: 5, D10: 5, D11: 5, D12: 5,
}; // sums to 105 — the document says 100

const KICKOFF_MAX: Record<string, number> = {
  D1: 10, D2: 10, D3: 5, D4: 15, D5: 10, D6: 10,
  D7: 5, D8: 10, D9: 10, D10: 5, D11: 5, D12: 5,
}; // sums to exactly 100

function dims(max: Record<string, number>, opts: {
  scores?: Record<string, number>;
  disabled?: string[];
  full?: boolean;
} = {}): DimensionOutcome[] {
  return Object.entries(max).map(([id, maxPoints]) => ({
    id,
    maxPoints,
    score: opts.disabled?.includes(id) ? null : (opts.scores?.[id] ?? (opts.full ? maxPoints : 0)),
    disabled: opts.disabled?.includes(id) ?? false,
    notEvidenced: false,
  }));
}

const cap = (o: Partial<CapOutcome> & { id: string }): CapOutcome => ({
  determination: "fired", scope: "dimension", target: null, clamp: 0, nonRecoverable: false, ...o,
});

// --------------------------------------------------------------- denominators

test("kickoff sums to exactly 100 — no normalisation distortion", () => {
  const r = computeTotal(dims(KICKOFF_MAX, { full: true }), [], "kickoff");
  assert.equal(r.maxPossible, 100);
  assert.equal(r.rawTotal, 100);
  assert.equal(r.normalizedTotal, 100);
  assert.equal(r.band.name, "ELITE");
});

test("coaching with nothing disabled uses the true 105 denominator", () => {
  const r = computeTotal(dims(COACHING_MAX, { full: true }), [], "coaching");
  assert.equal(r.maxPossible, 105);
  assert.equal(r.normalizedTotal, 100);
  assert.match(r.arithmeticNotes.join(" "), /sum to 105 while the document states the total is 100/);
});

test("D2 N/A alone promotes BOTH D3 and D4 to 20, denominator stays 105", () => {
  const { dims: out, notes } = resolveActiveSet(dims(COACHING_MAX, { disabled: ["D2"] }), "coaching");
  assert.equal(out.find((d) => d.id === "D3")!.maxPoints, 20);
  assert.equal(out.find((d) => d.id === "D4")!.maxPoints, 20);
  const active = out.filter((d) => !d.disabled).reduce((a, d) => a + d.maxPoints, 0);
  assert.equal(active, 105);
  assert.match(notes.join(" "), /redistribute weight to D3 and D4/);
});

test("D4 disabled alone gives denominator 90 — and says the rubric's 85 is wrong", () => {
  const r = computeTotal(dims(COACHING_MAX, { full: true, disabled: ["D4"] }), [], "coaching");
  assert.equal(r.maxPossible, 90);
  assert.match(r.arithmeticNotes.join(" "), /sum to 90 — the stated figure is\s+arithmetically wrong/);
});

test("D-02: D2 N/A AND D4 disabled — D3 absorbs all 10, denominator 90", () => {
  // This is coaching-02. The rubric says redistribute D2's weight "to D3 and D4", but D4 is the
  // disabled one, so as written the instruction cannot be executed.
  const { dims: out, notes } = resolveActiveSet(
    dims(COACHING_MAX, { disabled: ["D2", "D4"] }), "coaching",
  );
  const d3 = out.find((d) => d.id === "D3")!;
  assert.equal(d3.maxPoints, 25, "D3 must absorb the full 10, not half of it");

  const active = out.filter((d) => !d.disabled).reduce((a, d) => a + d.maxPoints, 0);
  assert.equal(active, 90, "denominator must be 90, matching the D4-disabled-only case");

  assert.match(notes.join(" "), /D4 is disabled on this call, so D3 absorbs the full weight/);
});

test("D-02 keeps the denominator stable at 90 whenever D4 is off", () => {
  // One rule covering both situations is the reason this branch was chosen.
  const d4Only = computeTotal(dims(COACHING_MAX, { full: true, disabled: ["D4"] }), [], "coaching");
  const both = computeTotal(dims(COACHING_MAX, { full: true, disabled: ["D2", "D4"] }), [], "coaching");
  assert.equal(d4Only.maxPossible, 90);
  assert.equal(both.maxPossible, 90);
  assert.equal(both.normalizedTotal, 100, "a perfect call must still reach 100 on the reduced set");
});

// ---------------------------------------------------------------------- caps

test("a dimension cap clamps only its own dimension", () => {
  const r = computeTotal(
    dims(COACHING_MAX, { full: true }),
    [cap({ id: "coaching-cap-vision", scope: "dimension", target: "D3", clamp: 10 })],
    "coaching",
  );
  assert.equal(r.dimensions.find((d) => d.id === "D3")!.score, 10);
  assert.equal(r.dimensions.find((d) => d.id === "D6")!.score, 15, "D6 untouched");
  assert.equal(r.rawTotal, 100); // 105 - 5
});

test("a non-recoverable cap floors to zero regardless of other evidence", () => {
  const r = computeTotal(
    dims(COACHING_MAX, { full: true }),
    [cap({ id: "coaching-cap-booking", scope: "dimension", target: "D10", clamp: 0, nonRecoverable: true })],
    "coaching",
  );
  assert.equal(r.dimensions.find((d) => d.id === "D10")!.score, 0);
  assert.match(r.arithmeticNotes.join(" "), /non-recoverable/);
});

test("total caps apply in REPORTED space and the lowest wins", () => {
  const r = computeTotal(
    dims(COACHING_MAX, { full: true }),
    [
      cap({ id: "coaching-cap-talkshare", scope: "total", clamp: 75 }),
      cap({ id: "coaching-cap-actionsteps", scope: "total", clamp: 70 }),
    ],
    "coaching",
  );
  assert.equal(r.normalizedTotal, 70, "two ceilings cannot stack; the lower one governs");
  assert.deepEqual(r.appliedTotalCaps, ["coaching-cap-talkshare", "coaching-cap-actionsteps"]);
  assert.equal(r.band.name, "INCONSISTENT");
});

test("a total cap above the score changes nothing but is still recorded", () => {
  const r = computeTotal(
    dims(COACHING_MAX, { scores: Object.fromEntries(Object.keys(COACHING_MAX).map((k) => [k, 0])) }),
    [cap({ id: "coaching-cap-talkshare", scope: "total", clamp: 75 })],
    "coaching",
  );
  assert.equal(r.normalizedTotal, 0);
  assert.deepEqual(r.appliedTotalCaps, [], "not applied — but the note explains why");
  assert.match(r.arithmeticNotes.join(" "), /already sits at or below its ceiling/);
});

test("an INDETERMINATE cap is never applied, and says so", () => {
  // The kickoff-02 talk-share case: the interval straddles the threshold.
  const r = computeTotal(
    dims(KICKOFF_MAX, { full: true }),
    [cap({ id: "kickoff-cap-talkshare", scope: "total", clamp: 80, determination: "indeterminate" })],
    "kickoff",
  );
  assert.equal(r.normalizedTotal, 100, "an unestablished penalty is not applied");
  assert.deepEqual(r.appliedTotalCaps, []);
  assert.match(r.arithmeticNotes.join(" "), /INDETERMINATE.*NOT\s+applied/s);
  assert.match(r.arithmeticNotes.join(" "), /Scored on the branch where\s+the cap does not fire/);
});

test("a not_fired cap does nothing at all", () => {
  const r = computeTotal(
    dims(KICKOFF_MAX, { full: true }),
    [cap({ id: "kickoff-cap-followups", scope: "total", clamp: 70, determination: "not_fired" })],
    "kickoff",
  );
  assert.equal(r.normalizedTotal, 100);
});

// ------------------------------------------------------------------- bands

test("band boundaries land on the rubrics' own names", () => {
  const at = (raw: number) => computeTotal(
    dims(KICKOFF_MAX, { scores: { D1: raw } }), [], "kickoff",
  ).band.name;
  assert.equal(at(90), "ELITE");
  assert.equal(at(89), "STRONG");
  assert.equal(at(80), "STRONG");
  assert.equal(at(79), "INCONSISTENT");
  assert.equal(at(69), "AT RISK");
  assert.equal(at(59), "FAIL");
});

// ------------------------------------------------------- the one thing

test("projectWith re-runs the pipeline and can lift a cap, not just add points", () => {
  // D3 scored 5/15 AND capped at 10 by the vision cap. Fixing D3 removes the cap too, so the
  // projected gain exceeds the raw score delta — which is why this re-runs rather than adds.
  const base = dims(COACHING_MAX, { full: true, scores: { D3: 5 } });
  const caps = [cap({ id: "coaching-cap-vision", scope: "dimension", target: "D3", clamp: 10 })];

  const before = computeTotal(base, caps, "coaching");
  const after = projectWith(base, caps, "coaching", "D3");

  assert.ok(after.normalizedTotal > before.normalizedTotal);
  assert.equal(after.dimensions.find((d) => d.id === "D3")!.score, 15, "lifted to full marks");
  assert.equal(after.normalizedTotal, 100);
});

test("projecting a disabled dimension changes nothing", () => {
  const base = dims(COACHING_MAX, { full: true, disabled: ["D4"] });
  const before = computeTotal(base, [], "coaching");
  const after = projectWith(base, [], "coaching", "D4");
  assert.equal(after.normalizedTotal, before.normalizedTotal);
});

// ------------------------------------------------- absence -> score (D-04)

import { resolveDimensionScore, requirementState, type RequirementOutcome } from "../lib/scoring/total.ts";

const req = (o: Partial<RequirementOutcome> & { requirementId: string }): RequirementOutcome =>
  ({ verifiedCount: 0, counterCount: 0, ...o });

const D8 = { id: "D8", maxPoints: 5, defaultWhenAbsent: 5, enum: [5, 3, 0] };
const D10 = { id: "D10", maxPoints: 5, defaultWhenAbsent: null, enum: [5, 0] };

test("the four requirement states are distinguished correctly", () => {
  assert.equal(requirementState(req({ requirementId: "a", verifiedCount: 2 })), "present");
  assert.equal(requirementState(req({ requirementId: "b" })), "not_evidenced");
  assert.equal(requirementState(req({ requirementId: "c", verifiedCount: 1, counterCount: 1 })), "contradicted");
  assert.equal(requirementState(req({ requirementId: "d", unscoreable: true })), "unscoreable");
});

test("absence CLAMPS to the rubric's default instead of flooring to zero", () => {
  // D8 is 5/5 when no struggle arose. A smooth call is not a failed one, and flooring would
  // be harsher than the source document.
  const r = resolveDimensionScore(D8, null, [req({ requirementId: "D8.r1" }), req({ requirementId: "D8.r2" })]);
  assert.equal(r.score, 5);
  assert.ok(r.notEvidenced);
  assert.match(r.statement!, /Not evidenced in the transcript/);
  assert.match(r.statement!, /clamps there rather than flooring to 0/);
});

test("absence with NO stated default scores the bottom of the scale — the cap is not dodged", () => {
  // D10: the coach did not book the next call. That must cost 0/5, not become "insufficient
  // data". Generalising absence into a free pass is what coaching-01 exists to catch.
  const r = resolveDimensionScore(D10, null, [req({ requirementId: "D10.r1" })]);
  assert.equal(r.score, 0);
  assert.ok(r.notEvidenced);
  assert.match(r.statement!, /Not evidenced in the transcript/);
  assert.match(r.statement!, /absence carries its full cost/);
});

test("a partly-evidenced dimension keeps its score but NAMES the gap", () => {
  // This is "the dimension says so": three of five behaviours present, and the report is
  // forced to state that two were not found.
  const D1 = { id: "D1", maxPoints: 10, defaultWhenAbsent: null, enum: [10, 7, 3, 0] };
  const r = resolveDimensionScore(D1, 7, [
    req({ requirementId: "D1.r1", verifiedCount: 2 }),
    req({ requirementId: "D1.r2", verifiedCount: 1 }),
    req({ requirementId: "D1.r3", verifiedCount: 1 }),
    req({ requirementId: "D1.r4" }),
    req({ requirementId: "D1.r5" }),
  ]);
  assert.equal(r.score, 7, "the model's bucket stands");
  assert.ok(r.notEvidenced);
  assert.match(r.statement!, /2 of 5 required behaviours are not evidenced/);
});

test("an unscoreable requirement is excluded, not counted against the coach", () => {
  const D12 = { id: "D12", maxPoints: 5, defaultWhenAbsent: null, enum: [5, 3, 0] };
  const r = resolveDimensionScore(D12, 5, [
    req({ requirementId: "D12.r1", verifiedCount: 2 }),
    req({ requirementId: "D12.r2", unscoreable: true }),
  ]);
  assert.equal(r.score, 5, "the unscoreable criterion must not drag the score down");
  assert.ok(!r.notEvidenced);
  assert.match(r.statement!, /cannot be settled from a transcript and were excluded/);
});

test("a disabled dimension declines to score and says why", () => {
  const D4 = { id: "D4", maxPoints: 15, defaultWhenAbsent: null, enum: [15, 10, 5, 0] };
  const r = resolveDimensionScore(D4, null, [], { reason: "no movement coaching occurred on this call" });
  assert.equal(r.score, null);
  assert.ok(!r.notEvidenced);
  assert.match(r.statement!, /Not scored - no movement coaching/);
});

test("fully evidenced dimension says nothing extra", () => {
  const r = resolveDimensionScore(D8, 5, [req({ requirementId: "D8.r1", verifiedCount: 3 })]);
  assert.equal(r.score, 5);
  assert.ok(!r.notEvidenced);
  assert.equal(r.statement, null);
});

test("THE TOP-BUCKET GATE: a missing Elite criterion blocks the top score", () => {
  // The first real run scored coaching-01 100/100 with D10 reporting "2 of 5 requirements
  // missing" and still taking 5/5. The top bucket is conjunctive; partial evidence cannot
  // reach it.
  const D1 = { id: "D1", maxPoints: 10, defaultWhenAbsent: null, enum: [10, 7, 3, 0] };
  const r = resolveDimensionScore(D1, 10, [
    req({ requirementId: "D1.r1", verifiedCount: 2 }),
    req({ requirementId: "D1.r2", verifiedCount: 1 }),
    req({ requirementId: "D1.r3" }), // missing
  ]);
  assert.equal(r.score, 7, "must fall to the next bucket down, not stay at 10");
  assert.match(r.statement!, /top bucket requires every one of its criteria/);
});

test("contradicted evidence also blocks the top score", () => {
  const D10 = { id: "D10", maxPoints: 5, defaultWhenAbsent: null, enum: [5, 0] };
  const r = resolveDimensionScore(D10, 5, [
    req({ requirementId: "D10.r1", verifiedCount: 2, counterCount: 1 }),
  ]);
  assert.equal(r.score, 0, "a contradicted booking cannot take full marks");
  assert.match(r.statement!, /cannot be treated as established/);
});

test("the gate does NOT touch a score already below the top", () => {
  const D1 = { id: "D1", maxPoints: 10, defaultWhenAbsent: null, enum: [10, 7, 3, 0] };
  const r = resolveDimensionScore(D1, 3, [
    req({ requirementId: "D1.r1", verifiedCount: 1 }),
    req({ requirementId: "D1.r2" }),
  ]);
  assert.equal(r.score, 3, "the model's lower bucket stands untouched");
});

test("a fully evidenced dimension still reaches the top", () => {
  const D1 = { id: "D1", maxPoints: 10, defaultWhenAbsent: null, enum: [10, 7, 3, 0] };
  const r = resolveDimensionScore(D1, 10, [
    req({ requirementId: "D1.r1", verifiedCount: 2 }),
    req({ requirementId: "D1.r2", verifiedCount: 1 }),
  ]);
  assert.equal(r.score, 10, "the gate must not make full marks unreachable");
  assert.equal(r.statement, null);
});
