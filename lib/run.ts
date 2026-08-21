import { createHash } from "node:crypto";
import { prepare, numbered } from "./transcript/canonicalise.ts";
import { parse, likelyCoach } from "./transcript/parse.ts";
import { buildPrefix } from "./scoring/prompt.ts";
import { scoreTranscript, type ScoreResult } from "./scoring/score.ts";
import { synthesize, type Synthesis } from "./scoring/synthesize.ts";
import { COACHING_PACK } from "./rubric/coaching.ts";
import { KICKOFF_PACK } from "./rubric/kickoff.ts";
import { checkBudget, estimateRunCost } from "./budget.ts";
import { enumGroups, type RubricPack } from "./rubric/types.ts";
import {
  createOrGetRun, packHash, upsertPack, markRunning, heartbeat, failRun, resetForRetry,
  saveDimension, saveCaps, saveReport, loadRun, type RunStatus,
} from "./db/queries.ts";
import type { ReportContract } from "./report/contract.ts";
import { phaseOf, currentDimensionId, estimate, staleIn, humanDuration, type Phase } from "./progress.ts";

/**
 * One run, start to finish.
 *
 * `start()` is deliberately cheap — it writes a row and returns an id, nothing more. The actual
 * scoring is `execute()`, which the route fires through Next's `after()` so the HTTP response
 * has already been sent. The operator can close the tab the instant they get their URL.
 */

export function packFor(callType: "kickoff" | "coaching"): RubricPack {
  return callType === "coaching" ? COACHING_PACK : KICKOFF_PACK;
}

/** Hash of the prompt template, so a prompt change produces a new run rather than silently
 *  reusing a report generated under different instructions. */
export function promptHash(pack: RubricPack, sampleTranscript = ""): string {
  return createHash("sha256")
    .update(buildPrefix(pack, sampleTranscript), "utf8")
    .digest("hex");
}

export interface StartResult {
  ok: boolean;
  runId: string | null;
  created: boolean;
  /**
   * True when this resolved to a run that had FAILED, and the row was reset so the worker can
   * try again. The caller must fire `execute()` for a retry exactly as it does for a new run —
   * otherwise the run sits at `queued` forever, which is the spinner the brief rules out.
   */
  retried: boolean;
  /** Populated when ok is false — shown to the operator verbatim. */
  message: string | null;
}

export async function start(input: {
  callType: "kickoff" | "coaching";
  transcript: string;
  coachName?: string;
  clientName?: string;
  effort?: "low" | "medium" | "high";
}): Promise<StartResult> {
  const canonical = prepare(input.transcript);
  if (canonical.lineCount < 2) {
    return { ok: false, runId: null, created: false, retried: false, message: "That does not look like a transcript — it has fewer than two speaking turns." };
  }

  const parsed = parse(canonical.body);
  if (parsed.speakers.length < 2) {
    return {
      ok: false, runId: null, created: false, retried: false,
      message:
        `Only one speaker was found. Transcripts must use the format "[Speaker Name]: what they ` +
        `said", one turn per line.` +
        (parsed.unmatched.length ? ` ${parsed.unmatched.length} line(s) did not match that format.` : ""),
    };
  }

  const pack = packFor(input.callType);

  // Refuse BEFORE charging anything. Running out of credit half way through is the worst
  // available failure: six dimensions scored, six 402s, and a report that looks finished.
  const est = estimateRunCost(canonical.body.length, enumGroups(pack).length);
  const budget = await checkBudget(est);
  if (!budget.ok) return { ok: false, runId: null, created: false, retried: false, message: budget.message };

  const sha = packHash(pack);
  await upsertPack(pack, sha);

  const { run, created } = await createOrGetRun({
    callType: input.callType,
    transcriptBody: canonical.body,
    transcriptSha256: canonical.sha256,
    coachName: input.coachName ?? likelyCoach(parsed),
    clientName: input.clientName ?? parsed.speakers.find((s) => s !== likelyCoach(parsed)) ?? null,
    packSha: sha,
    promptSha: promptHash(pack),
    effort: input.effort ?? "low",
  });

  // Re-pasting a transcript whose run DIED puts it back on the queue rather than returning a
  // permanently-failed report. Re-pasting one that succeeded, or is still going, does nothing.
  const retried = !created && run.status === "failed";
  if (retried) await resetForRetry(run.id);

  return { ok: true, runId: run.id, created, retried, message: null };
}

/**
 * The worker. Runs after the response has been sent.
 *
 * Commits per dimension and beats the heartbeat after each, so a death partway through loses one
 * dimension rather than twelve, and shows as a stalled heartbeat rather than a run that claims to
 * be working forever.
 *
 * That was not true until the callbacks below were wired: `onProgress` used to beat the heartbeat
 * and save nothing, so every row landed after the loop and the progress screen read 0/12 for the
 * entire run and then 12/12. The comment claiming otherwise sat here through a 243s run that
 * looked frozen to the person watching it.
 *
 * The per-dimension commit is also what would let this be split across two invocations of six
 * without a rewrite, if 300s ever stopped being enough.
 */
export async function execute(runId: string, callType: "kickoff" | "coaching", transcript: string, effort: "low" | "medium" | "high" = "low"): Promise<void> {
  const pack = packFor(callType);
  const canonical = prepare(transcript);
  const parsed = parse(canonical.body);

  try {
    await markRunning(runId);

    const result = await scoreTranscript(pack, {
      callType, transcript, effort, runId,

      // The fact pass has returned and every cap is resolved. Cap outcomes are FINAL at this
      // point — computeTotal reads caps, it never rewrites them — so this is a real commit, not
      // a provisional one. It is also the only durable evidence that the ~30s fact pass
      // finished, which is what lets progressFor tell "reading the call for facts" from "no
      // dimension has landed yet". Those are the same 0/12 and different truths.
      onFacts: async (caps) => {
        try { await saveCaps(runId, caps); }
        catch (e) { console.warn(`[${runId}] cap commit failed: ${e}`); }
        await heartbeat(runId);
      },

      // Commit each dimension AS IT LANDS, then beat.
      //
      // COMMIT THEN BEAT, in that order: a heartbeat written first claims liveness for work that
      // may not have landed, and the stale sweep in loadRun trusts it.
      //
      // The try/catch is load-bearing rather than defensive. Without it a transient Supabase
      // failure on dimension 11 throws into execute's outer catch, which calls failRun, and a
      // paid run that had already succeeded eleven twelfths is destroyed. The end-of-run pass
      // writes this row again regardless, so all a failure here costs is one tick of progress —
      // the page looks slower than it is, which is the safe direction.
      onProgress: async (ev) => {
        try { await saveDimension(runId, ev.provisional); }
        catch (e) { console.warn(`[${runId}] provisional commit of ${ev.dimensionId} failed: ${e}`); }
        await heartbeat(runId);
      },
    });

    // NOT redundant with the commits above. Every row written during the loop is PRE-arithmetic:
    // resolveActiveSet can promote maxPoints and scale score (D2 N/A sends D3 from 15 to 25), and
    // applyDimensionCaps can clamp or floor to 0 on a non-recoverable cap. This pass rewrites all
    // twelve with the post-computeTotal values and is the authoritative one. saveDimension upserts
    // on (run_id, dimension_id).
    for (const d of result.dimensions) await saveDimension(runId, d);
    await saveCaps(runId, result.caps);

    if (!result.ok) {
      await failRun(runId, "scoring_incomplete", `Scoring did not complete: ${result.failures.join(" | ")}`);
      return;
    }

    const synth = await synthesize(result, canonical.body, parsed, {
      prefix: buildPrefix(pack, numbered(canonical.body)),
      effort, runId,
    });

    const synthOk = synth.error ? null : synth;
    await saveReport(runId, result, synthOk, buildContract(runId, result, synthOk, new Date().toISOString()));
  } catch (err) {
    await failRun(runId, "worker_error", err instanceof Error ? err.message : String(err));
  }
}

/**
 * Assemble the ReportContract from the live scoring result, while everything is still in hand.
 *
 * Deliberately built here and stored whole rather than rebuilt from the normalised tables on
 * read: the talk-share interval, each cap's statement, and which branch an indeterminate cap was
 * scored on have no column of their own, and a report rendered next week must be the report that
 * was computed rather than a reconstruction that differs in some detail nobody checks.
 */
export function buildContract(
  runId: string,
  result: ScoreResult,
  synth: Synthesis | null,
  finishedAt: string,
): ReportContract {
  return {
    runId,
    callType: result.callType,
    coach: result.coach,
    client: result.client,
    transcriptSha256: result.transcriptSha256,
    finishedAt,
    status: "finished",
    failureReason: null,
    dimensions: result.dimensions.map((d) => ({
      id: d.id,
      title: d.title,
      score: d.score,
      maxPoints: d.maxPoints,
      bucketMatched: d.bucketMatched,
      disabled: d.disabled,
      disabledReason: d.disabledReason,
      notEvidenced: d.notEvidenced,
      absenceStatement: d.absenceStatement,
      reasoning: d.reasoning,
      quickFix: d.quickFix,
      evidence: d.evidence as ReportContract["dimensions"][number]["evidence"],
    })),
    caps: result.caps.map((c) => ({
      id: c.id,
      determination: c.determination,
      scope: c.scope,
      target: c.target,
      clamp: c.clamp,
      nonRecoverable: c.nonRecoverable,
      statement: c.statement ?? "",
    })),
    total: {
      rawTotal: result.total.rawTotal,
      maxPossible: result.total.maxPossible,
      normalizedTotal: result.total.normalizedTotal,
      band: result.total.band,
      appliedTotalCaps: result.total.appliedTotalCaps,
      arithmeticNotes: result.total.arithmeticNotes,
    },
    talkShare: {
      coachWordShare: result.talkShare.coachWordShare,
      coachTimeShareLow: result.talkShare.coachTimeShareLow,
      coachTimeShareHigh: result.talkShare.coachTimeShareHigh,
      rateRatioRange: result.talkShare.rateRatioRange,
    },
    oneThing: synth?.oneThing ?? null,
    brief: synth?.brief ?? null,
    redFlags: synth?.redFlags ?? null,
  };
}

/**
 * What GET serves. Four honest states, never a spinner: a finished run returns its stored
 * contract verbatim; a running one reports progress; a dead one says why.
 */
export async function contractFor(runId: string): Promise<ReportContract | null> {
  const loaded = await loadRun(runId);
  if (!loaded) return null;
  const { run, dimensions, report } = loaded;

  const stored = report?.contract as ReportContract | undefined;
  if (run.status === "succeeded" && stored) return stored;

  // Not finished: report the state truthfully rather than half a report.
  const status: ReportContract["status"] = run.status === "failed" ? "failed" : "running";
  return {
    runId: run.id,
    callType: run.call_type,
    coach: run.coach_name ?? "",
    client: run.client_name ?? "",
    transcriptSha256: run.transcript_sha256,
    finishedAt: run.finished_at,
    status,
    failureReason: run.status === "failed"
      ? `${run.error_code ?? "failed"}: ${run.error_message ?? "no detail recorded"}`
      : null,
    dimensions: [],
    caps: [],
    total: { rawTotal: 0, maxPossible: 0, normalizedTotal: 0, band: { name: "FAIL", min: 0, max: 59 }, appliedTotalCaps: [], arithmeticNotes: [] },
    talkShare: { coachWordShare: 0, coachTimeShareLow: 0, coachTimeShareHigh: 0, rateRatioRange: { min: 0.9, max: 1.2 } },
    oneThing: null,
    brief: null,
    redFlags: null,
  };
}

export interface RunProgress {
  done: number;
  total: number;
  phase: Phase;
  /** ISO. The client re-syncs its local elapsed counter from this, so clock skew never accumulates. */
  startedAt: string | null;
  elapsedMs: number;
  /** The dimension actually being scored, in CALL order. Null once all twelve have landed. */
  currentDimensionId: string | null;
  /** null when there is no evidence to estimate from. Never a guess. */
  etaMs: number | null;
  etaBasis: string;
  /**
   * The estimate already worded, so the browser never re-implements the formatter and the two
   * cannot drift. Coarse and qualified by construction — see humanDuration.
   */
  etaText: string;
  /** How long since the last dimension landed, and how long until the sweep declares it dead. */
  heartbeatAgeMs: number | null;
  staleInMs: number | null;
  /** Every dimension of the run's own rubric, in rubric order, with the ones that have landed. */
  dimensions: Array<{
    id: string;
    title: string;
    maxPoints: number;
    state: "scored" | "pending";
  }>;
}

/**
 * Progress for the running state — which of the twelve have landed, which one is live, and how
 * long it is likely to be.
 *
 * A thin adapter: everything that decides what may be *said* lives in lib/progress.ts, pure and
 * unit-tested without a database.
 *
 * Note what is deliberately absent from `dimensions`: a score. Rows committed mid-run are
 * pre-arithmetic and can still change, so the progress screen shows state and never a number.
 */
export async function progressFor(runId: string): Promise<RunProgress | null> {
  const loaded = await loadRun(runId);
  if (!loaded) return null;

  const pack = packFor(loaded.run.call_type);
  const landedIds = loaded.dimensions.map((d) => String(d.dimension_id));
  const landed = new Set(landedIds);
  const now = Date.now();

  const input = {
    status: loaded.run.status,
    startedAt: loaded.run.started_at,
    heartbeatAt: loaded.run.heartbeat_at,
    capsLanded: loaded.caps.length,
    landedIds,
    pack,
    now,
  };

  const eta = estimate(input);
  const startedMs = loaded.run.started_at ? new Date(loaded.run.started_at).getTime() : null;
  const beatMs = loaded.run.heartbeat_at ? new Date(loaded.run.heartbeat_at).getTime() : null;

  return {
    done: landedIds.length,
    total: pack.dimensions.length,
    phase: phaseOf(input),
    startedAt: loaded.run.started_at,
    elapsedMs: startedMs ? Math.max(0, now - startedMs) : 0,
    currentDimensionId: currentDimensionId(pack, landedIds),
    etaMs: eta.etaMs,
    etaBasis: eta.basis,
    etaText:
      eta.etaMs === null
        ? (phaseOf(input) === "facts" ? "ESTIMATE ONCE THE FIRST DIMENSION LANDS" : "NO ESTIMATE")
        : `ABOUT ${humanDuration(eta.etaMs).toUpperCase()} LEFT`,
    heartbeatAgeMs: beatMs ? Math.max(0, now - beatMs) : null,
    staleInMs: staleIn(loaded.run.heartbeat_at, now),
    dimensions: pack.dimensions.map((d) => ({
      id: d.id,
      title: d.title,
      maxPoints: d.maxPoints,
      state: landed.has(d.id) ? ("scored" as const) : ("pending" as const),
    })),
  };
}

export type { RunStatus };
