import { test } from "node:test";
import assert from "node:assert/strict";

import { phaseOf, currentDimensionId, estimate, staleIn, humanDuration, STALE_MS } from "../lib/progress.ts";
import { COACHING_PACK } from "../lib/rubric/coaching.ts";
import { KICKOFF_PACK } from "../lib/rubric/kickoff.ts";

const iso = (ms: number) => new Date(ms).toISOString();

// ---------------------------------------------------------------- which row is live

test("the live dimension follows CALL order, not rubric order", () => {
  // The whole reason this function exists. callOrder groups by score enum for the prompt cache
  // and forces D12 last, so coaching runs D1 D2 D5 D3 D4 ... — diverging from rubric order at the
  // THIRD call. The progress screen used to mark the live row as rubricOrder[done], which names a
  // different dimension from that point on. It was invisible only because `done` was always 0.
  assert.equal(currentDimensionId(COACHING_PACK, ["D1", "D2"]), "D5");
  assert.notEqual(currentDimensionId(COACHING_PACK, ["D1", "D2"]), "D3");

  assert.equal(currentDimensionId(KICKOFF_PACK, ["D1", "D2"]), "D6");
  assert.notEqual(currentDimensionId(KICKOFF_PACK, ["D1", "D2"]), "D3");
});

test("D12 is always last, because its inputs are the other dimensions' outcomes", () => {
  for (const pack of [COACHING_PACK, KICKOFF_PACK]) {
    const allButLast = pack.dimensions.map((d) => d.id).filter((id) => id !== "D12");
    assert.equal(currentDimensionId(pack, allButLast), "D12");
  }
});

test("nothing is live once every dimension has landed", () => {
  const all = COACHING_PACK.dimensions.map((d) => d.id);
  assert.equal(currentDimensionId(COACHING_PACK, all), null);
});

// ---------------------------------------------------------------- phase

test("phase separates the fact pass from a run that has not started scoring", () => {
  const base = { pack: COACHING_PACK, landedIds: [] as string[] };
  // Both are 0/12. Only a committed cap row tells them apart.
  assert.equal(phaseOf({ ...base, status: "running", capsLanded: 0 }), "facts");
  assert.equal(phaseOf({ ...base, status: "running", capsLanded: 6 }), "dimensions");
  assert.equal(phaseOf({ ...base, status: "queued", capsLanded: 0 }), "queued");
});

test("phase reaches synthesis only when all twelve have landed", () => {
  const all = COACHING_PACK.dimensions.map((d) => d.id);
  assert.equal(phaseOf({ pack: COACHING_PACK, status: "running", capsLanded: 6, landedIds: all }), "synthesis");
  assert.equal(
    phaseOf({ pack: COACHING_PACK, status: "running", capsLanded: 6, landedIds: all.slice(0, 11) }),
    "dimensions",
  );
});

// ---------------------------------------------------------------- the estimate

const FACT_MS = 30_000;
const PER_DIM_MS = 20_000;

/** A run obeying a known true model, `done` dimensions in. */
function runAt(done: number) {
  const started = 1_000_000;
  const landed = started + FACT_MS + done * PER_DIM_MS;
  return {
    status: "running" as const,
    startedAt: iso(started),
    heartbeatAt: iso(landed),
    capsLanded: 6,
    landedIds: COACHING_PACK.dimensions.slice(0, done).map((d) => d.id),
    pack: COACHING_PACK,
    now: landed,
  };
}

/** Truth: the remaining dimensions plus synthesis, which costs about one dimension. */
const trueRemaining = (done: number) => (12 - done + 1) * PER_DIM_MS;

test("no number before the first dimension lands, and it says why", () => {
  const e = estimate(runAt(0));
  assert.equal(e.etaMs, null);
  assert.match(e.basis, /nothing to estimate from/);
});

test("the estimate errs LONG, and the overshoot shrinks as evidence accumulates", () => {
  // This is the property that keeps it from ever becoming a lying countdown, encoded so that
  // nobody "improves" it into a trailing-window rate that can undershoot.
  const early = estimate(runAt(1));
  const later = estimate(runAt(6));

  const overshootEarly = early.etaMs! - trueRemaining(1);
  const overshootLater = later.etaMs! - trueRemaining(6);

  assert.ok(overshootEarly > 0, `done=1 must over-estimate, overshot by ${overshootEarly}ms`);
  assert.ok(overshootLater > 0, `done=6 must over-estimate, overshot by ${overshootLater}ms`);
  assert.ok(
    overshootLater < overshootEarly,
    `the estimate must tighten: ${overshootLater}ms at done=6 vs ${overshootEarly}ms at done=1`,
  );
});

test("the projected finish can never be in the past, for any input", () => {
  for (const done of [1, 5, 11, 12]) {
    for (const drift of [0, 60_000, 600_000]) {
      const r = { ...runAt(done), now: runAt(done).now + drift };
      const e = estimate(r);
      if (e.etaMs !== null) assert.ok(e.etaMs >= 0, `done=${done} drift=${drift} gave ${e.etaMs}`);
    }
  }
});

test("a run past its own pace drops the number rather than shaving it toward zero", () => {
  const r = runAt(3);
  const stalled = { ...r, now: r.now + PER_DIM_MS * 3 };
  const e = estimate(stalled);
  assert.equal(e.etaMs, null);
  assert.equal(e.overrunning, true);
  assert.match(e.basis, /longer than this run's own pace/);
});

test("a finished or failed run is not given a time", () => {
  const r = runAt(5);
  assert.equal(estimate({ ...r, status: "succeeded" }).etaMs, null);
  assert.equal(estimate({ ...r, status: "failed" }).etaMs, null);
});

test("the basis always names the evidence behind the number", () => {
  const e = estimate(runAt(5));
  assert.match(e.basis, /5 dimensions in/);
});

// ---------------------------------------------------------------- the stale deadline

test("the stale countdown tracks a real deadline with a defined consequence", () => {
  const beat = 5_000_000;
  assert.equal(staleIn(iso(beat), beat), STALE_MS);
  assert.equal(staleIn(iso(beat), beat + 60_000), STALE_MS - 60_000);
  // Never negative — past the deadline the next read sweeps it, it does not count backwards.
  assert.equal(staleIn(iso(beat), beat + STALE_MS * 3), 0);
  assert.equal(staleIn(null, beat), null);
});

test("durations are coarse, never a second-by-second countdown", () => {
  assert.equal(humanDuration(4_000), "4s");
  assert.equal(humanDuration(45_000), "45s");
  assert.equal(humanDuration(120_000), "2 min");
  assert.equal(humanDuration(150_000), "2 min 30 s");
  assert.match(humanDuration(400_000), /^\d+ min$/);
});
