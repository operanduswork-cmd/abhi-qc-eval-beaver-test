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
 * Commits per dimension and beats the heartbeat after each, so a death partway through is
 * visible as a stalled heartbeat rather than a run that claims to be working forever. That
 * per-dimension commit is also what would let this be split across two invocations of six
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
      // Beat after every dimension. A run that dies then has a heartbeat that stops
      // advancing, which is what lets GET distinguish "still going" from "the worker died".
      onProgress: async () => { await heartbeat(runId); },
    });

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
  /** Every dimension of the rubric, in order, with the ones that have landed carrying scores. */
  dimensions: Array<{
    id: string;
    title: string;
    maxPoints: number;
    /** Set only once the dimension has landed. */
    score: number | null;
    state: "scored" | "pending";
  }>;
}

/**
 * Progress for the running state — which of the twelve have landed, not merely how many.
 *
 * The progress screen is a designed layout with a row per dimension, so it needs the names and
 * the per-row state. It was previously served the design's own mock rows, which showed a
 * hardcoded "9 / 12" and twelve invented scores directly above the real count. Two numbers
 * about the same run, disagreeing, on one screen.
 *
 * A dimension is only ever "scored" or "pending" here. There is no third row state for a
 * dimension that failed: the worker fails the whole run rather than banking eleven twelfths,
 * because a report missing one dimension still shows a total, and that total would be wrong.
 */
export async function progressFor(runId: string): Promise<RunProgress | null> {
  const loaded = await loadRun(runId);
  if (!loaded) return null;

  const pack = packFor(loaded.run.call_type);
  const landed = new Map(
    loaded.dimensions.map((d) => [String(d.dimension_id), d as Record<string, unknown>]),
  );

  return {
    done: loaded.dimensions.length,
    total: pack.dimensions.length,
    dimensions: pack.dimensions.map((d) => {
      const row = landed.get(d.id);
      return {
        id: d.id,
        title: d.title,
        maxPoints: row ? Number(row.max_points) : d.maxPoints,
        score: row && row.score !== null ? Number(row.score) : null,
        state: row ? ("scored" as const) : ("pending" as const),
      };
    }),
  };
}

export type { RunStatus };
