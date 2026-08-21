// End-to-end checks on the run lifecycle that cost NOTHING: idempotency, the four states, and
// the stale-worker sweep. No model calls.
import { readFileSync } from "node:fs";
import { join } from "node:path";
for (const line of readFileSync(join(import.meta.dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim();
}
const { start, contractFor, progressFor } = await import("../lib/run.ts");
const { db, markRunning, saveDimension, STALE_MS } = await import("../lib/db/queries.ts");

const transcript = readFileSync(join(import.meta.dirname, "..", "fixtures", "transcripts", "coaching-01.txt"), "utf8");
let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${name}${detail ? "  — " + detail : ""}`);
  ok ? pass++ : fail++;
};

// 1 — a run starts and returns an id fast
const t0 = Date.now();
const a = await start({ callType: "coaching", transcript });
const ms = Date.now() - t0;
check("POST returns a run id", a.ok && !!a.runId, a.message ?? `${ms}ms`);
check("and returns fast (no model call)", ms < 3000, `${ms}ms`);

// 2 — IDEMPOTENCY: the same paste must resolve to the same run and the same URL
const b = await start({ callType: "coaching", transcript });
check("same transcript -> same run id", a.runId === b.runId, `${a.runId?.slice(0, 8)} vs ${b.runId?.slice(0, 8)}`);
check("second start reports reused, not created", b.created === false);

// 3 — a different call type is a different run
const c = await start({ callType: "kickoff", transcript });
check("different rubric -> different run", c.runId !== a.runId);

// 4 — states
const queued = await contractFor(a.runId!);
check("a fresh run reports running/queued, not finished", queued?.status === "running", queued?.status);
check("progress is reported while running", (await progressFor(a.runId!))?.total === 12);

// 5 — THE STALE SWEEP: a worker that dies must become `failed`, not spin forever
await markRunning(a.runId!);
await db().from("runs")
  .update({ heartbeat_at: new Date(Date.now() - STALE_MS - 5000).toISOString() })
  .eq("id", a.runId!);
const swept = await contractFor(a.runId!);
check("a stale heartbeat flips the run to failed", swept?.status === "failed", swept?.status);
check("and the failure says why", !!swept?.failureReason?.includes("worker_died"), swept?.failureReason?.slice(0, 60));

// 6 — an unknown id is a clean 404, not a crash
check("unknown run id returns null", (await contractFor("00000000-0000-4000-8000-000000000000")) === null);

// 7 — a garbage transcript is refused with a reason, before anything is charged
const junk = await start({ callType: "coaching", transcript: "this is not a transcript at all" });
check("junk input is refused with a message", !junk.ok && !!junk.message, junk.message?.slice(0, 55));

// cleanup
for (const id of [a.runId, c.runId].filter(Boolean)) await db().from("runs").delete().eq("id", id!);
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
