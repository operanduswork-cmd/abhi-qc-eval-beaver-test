/**
 * Keeps the seeded "still scoring" demo run alive.
 *
 *   node --experimental-strip-types test/browser/beat.ts <run-id>
 *
 * `loadRun` sweeps a run with no heartbeat for STALE_MS (120s) to `worker_died`, which is
 * correct behaviour and inconvenient when you are trying to photograph the state before it — the
 * screenshot pass and the browser suite both take longer than two minutes, so by the time they
 * reach the progress screen the demo run has honestly died.
 *
 * Bumping `heartbeat_at` alone is not enough once that has happened: the sweep has already
 * written `status: 'failed'` and nothing reads the heartbeat of a failed run. So this puts the
 * status back too. It is a test fixture, not app code — no route calls it.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

for (const line of readFileSync(join(import.meta.dirname, "..", "..", ".env.local"), "utf8").split(/\r?\n/)) {
  if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim();
}

const runId = process.argv[2];
if (!runId) throw new Error("usage: node test/browser/beat.ts <run-id>");

const { db } = await import("../../lib/db/queries.ts");
const now = new Date().toISOString();
const r = await db().from("runs").update({
  status: "running", error_code: null, error_message: null, finished_at: null, heartbeat_at: now,
}).eq("id", runId).select("id").maybeSingle();

if (r.error) throw r.error;
if (!r.data) throw new Error(`no run ${runId} — run \`npm run browser-seed\` first`);
console.log("  demo run revived, heartbeat fresh");
