import { callOrder, type RubricPack } from "./rubric/types.ts";

/**
 * What the progress screen is allowed to say, computed from values only.
 *
 * Pure on purpose: every other file under `test/` runs without a database, and `progressFor` in
 * lib/run.ts is the thin adapter that fetches the rows and calls in here. That keeps the honesty
 * rules below — which are the whole point — testable with `npm test` and no `.env.local`.
 */

export type Phase = "queued" | "facts" | "dimensions" | "synthesis";

/** How long a `running` run may go without a heartbeat before loadRun declares it dead. */
export const STALE_MS = 120_000;

export interface ProgressInput {
  status: "queued" | "running" | "succeeded" | "failed";
  startedAt: string | null;
  heartbeatAt: string | null;
  /** Rows in run_caps. Non-zero means the fact pass returned, one way or the other. */
  capsLanded: number;
  /** Dimension ids committed so far, in any order. */
  landedIds: string[];
  pack: RubricPack;
  now: number;
}

export interface Estimate {
  /** null when there is not yet any evidence to estimate from. Never a guess. */
  etaMs: number | null;
  /** Why the number is what it is, or why there isn't one. Rendered next to it. */
  basis: string;
  /** True once this run has already exceeded its own established pace. */
  overrunning: boolean;
}

/**
 * Which phase the run is in.
 *
 * The fact pass takes ~20-30s during which zero dimensions have landed — the same `0/12` the
 * screen shows before anything starts. A `run_caps` row is the only durable thing that separates
 * them, which is why execute() commits caps the moment the fact pass returns.
 */
export function phaseOf(input: Pick<ProgressInput, "status" | "capsLanded" | "landedIds" | "pack">): Phase {
  if (input.status === "queued") return "queued";
  if (input.capsLanded === 0) return "facts";
  if (input.landedIds.length >= input.pack.dimensions.length) return "synthesis";
  return "dimensions";
}

/**
 * The dimension actually being scored right now — the first in CALL order not yet committed.
 *
 * This is the whole reason the function exists. `callOrder()` groups dimensions by score enum so
 * same-enum calls share a warm prompt cache, and forces D12 last because its negative signals are
 * the other dimensions' outcomes. Coaching therefore runs D1 D2 D5 D3 D4 D6 D7 D8 D9 D11 D10 D12,
 * and kickoff D1 D2 D6 D8 D9 D3 D10 D4 D5 D7 D11 D12 — both diverging from rubric order at the
 * THIRD call.
 *
 * The progress screen used to mark the live row as `rubricOrder[done]`, which is a different
 * dimension from the third one onward. Nobody could see it, because `done` was always 0.
 */
export function currentDimensionId(pack: RubricPack, landedIds: string[]): string | null {
  const landed = new Set(landedIds);
  return callOrder(pack).find((id) => !landed.has(id)) ?? null;
}

/**
 * Time remaining, or an honest refusal to say.
 *
 * Two deliberate over-estimates, both in the safe direction — an estimate the run beats is fine,
 * a countdown that hits zero and keeps going is a lie:
 *
 *   1. `perDim` amortises the fact pass across the dimensions that have landed, so it is worst at
 *      done=1 and tightens monotonically. The estimate starts pessimistic and improves.
 *   2. Synthesis is charged one full dimension. It is one model call over the same cached prefix,
 *      so this errs long. Pretending it is free is how a page reaches 12/12 and then sits there
 *      with nothing to say.
 *
 * The figure can go UP when a dimension is slow. That is correct: it is recomputed from evidence,
 * not interpolated, and the "about" framing carries it.
 */
export function estimate(input: ProgressInput): Estimate {
  const total = input.pack.dimensions.length;
  const done = input.landedIds.length;

  if (input.status !== "running" || !input.startedAt) {
    return { etaMs: null, basis: "this run is not scoring", overrunning: false };
  }

  // No dimension has landed, so there is nothing measured to extrapolate from. The ~20s/dimension
  // figure from an earlier run is NOT used here: it was measured on a 9 KB transcript and this one
  // may be 65 KB. A number measured on one input and displayed for another is an invented number.
  if (done === 0) {
    return {
      etaMs: null,
      basis: "no dimension has landed yet, so there is nothing to estimate from",
      overrunning: false,
    };
  }

  const startedAt = new Date(input.startedAt).getTime();
  const landedAt = input.heartbeatAt ? new Date(input.heartbeatAt).getTime() : startedAt;

  const perDim = Math.max(1, (landedAt - startedAt) / done);
  // +1 charges synthesis one dimension's worth of time.
  const remainingFromLanded = (total - done + 1) * perDim;
  const sinceLanded = Math.max(0, input.now - landedAt);
  const etaMs = Math.max(0, remainingFromLanded - sinceLanded);

  // This run has already blown past its own established pace with nothing new landing. Drop the
  // number rather than keep shaving it toward a zero it will not honour.
  const overrunning = sinceLanded > perDim * 1.5;

  return {
    etaMs: overrunning ? null : etaMs,
    basis: overrunning
      ? `running longer than this run's own pace — last dimension landed ${Math.round(sinceLanded / 1000)}s ago`
      : `from ${done} dimension${done === 1 ? "" : "s"} in ${humanDuration(landedAt - startedAt)} on this run`,
    overrunning,
  };
}

/**
 * Coarse and always qualified. Never a second-by-second countdown — the caller renders this with
 * "about" in front of it, and only ever recomputes it when a poll brings new evidence.
 */
export function humanDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 5) return rem >= 30 ? `${m} min 30 s` : `${m} min`;
  return `${rem >= 30 ? m + 1 : m} min`;
}

/** Milliseconds until the stale sweep declares this run dead. A real deadline, so a real countdown. */
export function staleIn(heartbeatAt: string | null, now: number): number | null {
  if (!heartbeatAt) return null;
  return Math.max(0, STALE_MS - (now - new Date(heartbeatAt).getTime()));
}
