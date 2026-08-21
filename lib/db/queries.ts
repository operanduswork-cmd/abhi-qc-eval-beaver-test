import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { MODEL, SCORER_VERSION } from "../openrouter.ts";
import type { RubricPack } from "../rubric/types.ts";
import type { ScoreResult } from "../scoring/score.ts";
import type { Synthesis } from "../scoring/synthesize.ts";

/**
 * Every database access in the app.
 *
 * There is no anon client and no browser-side query. RLS is enabled on all five tables with
 * ZERO policies, so `anon` can read nothing at all; the service key bypasses RLS and every read
 * is served through GET /api/runs/[id]. A "public read by id" policy would in practice be
 * `select using (true)`, which makes the whole runs table enumerable — the uuid protects one
 * row, never the table.
 */

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY)");
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

/**
 * Content hash of a compiled pack. Stored so a run from last week still resolves to the exact
 * rubric that scored it — a hand-bumped version string drifts, a content hash cannot.
 */
export function packHash(pack: RubricPack): string {
  return createHash("sha256").update(stableStringify(pack), "utf8").digest("hex");
}

/**
 * Key order must not vary or the hash does, and then the idempotency index stops matching and
 * every run re-scores. JSON.stringify preserves insertion order, which is not a guarantee we
 * can rely on across a refactor.
 */
function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const keys = Object.keys(v as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`).join(",")}}`;
}

export type RunStatus = "queued" | "running" | "succeeded" | "failed";

export interface RunRow {
  id: string;
  call_type: "kickoff" | "coaching";
  transcript_body: string;
  transcript_sha256: string;
  coach_name: string | null;
  client_name: string | null;
  status: RunStatus;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  heartbeat_at: string | null;
  finished_at: string | null;
  resolved_provider: string | null;
}

export interface CreateRunInput {
  callType: "kickoff" | "coaching";
  transcriptBody: string;
  transcriptSha256: string;
  coachName?: string | null;
  clientName?: string | null;
  packSha: string;
  promptSha: string;
  effort: string;
}

/**
 * Insert, or return the existing run for identical input.
 *
 * `runs_idempotency` is unique over (transcript, call type, pack, prompt, model, scorer version),
 * so the same paste always resolves to the same run id and the same URL. Pasting a transcript
 * twice must not produce two reports that disagree — that alone would sink the determinism claim
 * regardless of how stable the model is.
 */
export async function createOrGetRun(input: CreateRunInput): Promise<{ run: RunRow; created: boolean }> {
  const row = {
    call_type: input.callType,
    transcript_body: input.transcriptBody,
    transcript_sha256: input.transcriptSha256,
    coach_name: input.coachName ?? null,
    client_name: input.clientName ?? null,
    rubric_pack_sha256: input.packSha,
    prompt_template_sha256: input.promptSha,
    model_id: MODEL,
    effort: input.effort,
    scorer_version: SCORER_VERSION,
    status: "queued" as const,
  };

  const insert = await db().from("runs").insert(row).select().single();
  if (!insert.error) return { run: insert.data as RunRow, created: true };

  // 23505 = unique violation on runs_idempotency: this exact input already has a run.
  if ((insert.error as { code?: string }).code !== "23505") throw insert.error;

  const existing = await db().from("runs").select("*")
    .eq("transcript_sha256", input.transcriptSha256)
    .eq("call_type", input.callType)
    .eq("rubric_pack_sha256", input.packSha)
    .eq("prompt_template_sha256", input.promptSha)
    .eq("model_id", MODEL)
    .eq("scorer_version", SCORER_VERSION)
    .single();
  if (existing.error) throw existing.error;
  return { run: existing.data as RunRow, created: false };
}

export async function markRunning(runId: string): Promise<void> {
  const now = new Date().toISOString();
  await db().from("runs").update({ status: "running", started_at: now, heartbeat_at: now }).eq("id", runId);
}

/**
 * Called after EACH dimension lands, not once at the end. A run that dies mid-way then has a
 * heartbeat that stops advancing, which is what lets GET tell "still going" from "the worker
 * died" — the difference between an honest progress page and a spinner that never resolves.
 */
export async function heartbeat(runId: string): Promise<void> {
  await db().from("runs").update({ heartbeat_at: new Date().toISOString() }).eq("id", runId);
}

/**
 * Put a failed run back on the queue.
 *
 * Without this a failed run is permanent. `runs_idempotency` is unique over the transcript, the
 * pack, the prompt, the model and the scorer version, so re-pasting the same transcript resolves
 * to the SAME row — which is exactly what makes the URL stable, and also means a run killed by a
 * network blip could never be scored again. Clearing the error and the timestamps lets the worker
 * run once more against the same id, so the link someone was already given starts working rather
 * than a second URL appearing for the same call.
 *
 * Partial dimensions are deleted rather than kept: the worker upserts by (run, dimension), so
 * stale rows from the dead attempt would otherwise be silently mixed into the retry's report.
 */
export async function resetForRetry(runId: string): Promise<void> {
  await db().from("run_dimensions").delete().eq("run_id", runId);
  await db().from("run_caps").delete().eq("run_id", runId);
  await db().from("runs").update({
    status: "queued", error_code: null, error_message: null,
    started_at: null, heartbeat_at: null, finished_at: null,
  }).eq("id", runId);
}

export async function failRun(runId: string, code: string, message: string): Promise<void> {
  await db().from("runs").update({
    status: "failed", error_code: code, error_message: message,
    finished_at: new Date().toISOString(),
  }).eq("id", runId);
}

/** Commit one dimension as soon as it lands, so a death mid-run loses one dimension, not twelve. */
export async function saveDimension(runId: string, d: ScoreResult["dimensions"][number]): Promise<void> {
  await db().from("run_dimensions").upsert({
    run_id: runId,
    dimension_id: d.id,
    score: d.score,
    max_points: d.maxPoints,
    bucket_matched: d.bucketMatched,
    disabled: d.disabled,
    disabled_reason: d.disabledReason,
    not_evidenced: d.notEvidenced,
    reasoning: d.reasoning,
    quick_fix: d.quickFix,
    evidence: d.evidence,
    generation_id: d.generationId,
  }, { onConflict: "run_id,dimension_id" });
}

export async function saveCaps(runId: string, caps: ScoreResult["caps"]): Promise<void> {
  if (!caps.length) return;
  await db().from("run_caps").upsert(
    caps.map((c) => ({
      run_id: runId,
      cap_id: c.id,
      determination: c.determination,
      scope: c.scope,
      clamp_value: c.clamp,
      supporting: c.supporting,
      counter_evidence: c.counterEvidence,
    })),
    { onConflict: "run_id,cap_id" },
  );
}

export async function saveReport(
  runId: string,
  result: ScoreResult,
  synth: Synthesis | null,
  contract: unknown,
): Promise<void> {
  await db().from("run_reports").upsert({
    run_id: runId,
    // The page renders THIS, not a reconstruction of it. See 0002_report_contract.sql.
    contract,
    one_thing: synth?.oneThing?.text ?? null,
    one_thing_projected_score: synth?.projectedTotal ?? null,
    brief: synth?.brief ?? null,
    red_flags: synth?.redFlags ?? [],
    raw_total: result.total.rawTotal,
    max_possible: result.total.maxPossible,
    normalized_total: result.total.normalizedTotal,
    band: result.total.band.name,
    rubric_arithmetic_note: result.total.arithmeticNotes.join("\n"),
  }, { onConflict: "run_id" });

  await db().from("runs").update({
    status: "succeeded",
    finished_at: new Date().toISOString(),
    resolved_provider: result.dimensions.find((d) => d.generationId)?.generationId ? "anthropic" : null,
  }).eq("id", runId);
}

export async function upsertPack(pack: RubricPack, sha: string): Promise<void> {
  await db().from("rubric_packs").upsert(
    { sha256: sha, call_type: pack.callType, pack: pack as unknown as Record<string, unknown> },
    { onConflict: "sha256" },
  );
}

/**
 * How long a `running` run may go without a heartbeat before we call it dead.
 *
 * Generous relative to the ~20s a dimension takes, because declaring a live run dead is worse
 * than showing "still going" for an extra minute — but finite, because the one thing the brief
 * forbids outright is a spinner that spins forever.
 */
export const STALE_MS = 120_000;

export interface LoadedRun {
  run: RunRow;
  dimensions: Record<string, unknown>[];
  caps: Record<string, unknown>[];
  report: Record<string, unknown> | null;
  /** True when this GET is what flipped it to failed. */
  sweptDead: boolean;
}

/**
 * Read a run, and sweep it if the worker died.
 *
 * The sweep lives here rather than in a scheduler because Vercel Cron on Hobby runs at most
 * once per DAY — a cron-driven sweeper is not available on the free tier at all. Doing it on
 * read costs nothing and is exactly as timely as it needs to be: nobody learns a run is dead
 * until they look at it.
 */
export async function loadRun(runId: string): Promise<LoadedRun | null> {
  const r = await db().from("runs").select("*").eq("id", runId).maybeSingle();
  if (r.error || !r.data) return null;
  let run = r.data as RunRow;
  let sweptDead = false;

  // Read the children BEFORE deciding the run is dead: how many dimensions landed changes what
  // is true to say about it. The message used to claim "the last dimension completed 214s ago"
  // for a run where no dimension ever completed.
  const [dims, caps, report] = await Promise.all([
    db().from("run_dimensions").select("*").eq("run_id", runId),
    db().from("run_caps").select("*").eq("run_id", runId),
    db().from("run_reports").select("*").eq("run_id", runId).maybeSingle(),
  ]);
  const landed = (dims.data ?? []).length;

  if (run.status === "running" && run.heartbeat_at) {
    const age = Date.now() - new Date(run.heartbeat_at).getTime();
    if (age > STALE_MS) {
      const secs = Math.round(age / 1000);
      const why =
        `Scoring stopped responding. ` +
        (landed === 0
          ? `No dimension finished at all; the last sign of life was ${secs}s ago. `
          : `${landed} of 12 dimensions had finished, the most recent ${secs}s ago, and nothing ` +
            `has progressed since. `) +
        `Nothing partial is shown, because a half-scored report is worse than no report. ` +
        `Re-running the same transcript is safe — it resolves to this same run and will not ` +
        `be charged twice.`;
      await failRun(run.id, "worker_died", why);
      // Carry the message into the in-memory row too. Writing it to the database and then
      // returning an object without it is how a failed run ends up on the page saying
      // "worker_died: no detail recorded" — a failure that does not say why is the one thing
      // the brief rules out.
      run = { ...run, status: "failed", error_code: "worker_died", error_message: why };
      sweptDead = true;
    }
  }

  return {
    run,
    dimensions: (dims.data ?? []) as Record<string, unknown>[],
    caps: (caps.data ?? []) as Record<string, unknown>[],
    report: (report.data ?? null) as Record<string, unknown> | null,
    sweptDead,
  };
}


export interface RunSummary {
  id: string;
  callType: "kickoff" | "coaching";
  status: RunStatus;
  score: number | null;
  band: string | null;
  createdAt: string;
}

/**
 * Summaries for a caller-supplied list of run ids — what the landing page's list needs, and
 * nothing else.
 *
 * There is deliberately NO "list all runs" query. The first version of the landing page had
 * one, and it showed every visitor every transcript anyone had ever scored: the run id is the
 * capability, so a page that hands the ids out gives that capability away. The landing now
 * lists only the runs THIS browser started, from localStorage, and asks for them by id. You
 * cannot ask this for a run whose uuid you do not already have.
 *
 * Capped, and it returns rows for the ids it finds rather than erroring on the ones it does
 * not — a run deleted upstream should drop off the list, not blank it.
 */
export async function summariesFor(ids: string[]): Promise<RunSummary[]> {
  const wanted = ids
    .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    .slice(0, 24);
  if (!wanted.length) return [];

  const r = await db()
    .from("runs")
    .select("id,call_type,status,created_at,run_reports(normalized_total,band)")
    .in("id", wanted);
  if (r.error || !r.data) return [];

  const rows = (r.data as Record<string, unknown>[]).map((row) => {
    // PostgREST returns an embedded one-to-one as either an object or a single-element array.
    const rep = Array.isArray(row.run_reports) ? row.run_reports[0] : row.run_reports;
    return {
      id: row.id as string,
      callType: row.call_type as "kickoff" | "coaching",
      status: row.status as RunStatus,
      score: (rep as { normalized_total?: number } | null)?.normalized_total ?? null,
      band: (rep as { band?: string } | null)?.band ?? null,
      createdAt: row.created_at as string,
    };
  });

  // Preserve the caller's order — the browser keeps them most-recent-first and the list should
  // read the same way after a round trip.
  const order = new Map(wanted.map((id, i) => [id.toLowerCase(), i]));
  return rows.sort((a, b) => (order.get(a.id.toLowerCase()) ?? 0) - (order.get(b.id.toLowerCase()) ?? 0));
}
