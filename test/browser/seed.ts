/**
 * Seeds the two run states the browser suite cannot produce for free.
 *
 *   npm run browser-seed
 *
 * A finished run already exists (it cost real money and is the demo report). A *running* run and
 * a *dead* run would each cost another full scoring pass to produce naturally, and the point of
 * photographing them is the layout, not the model. So they are written directly — with real
 * fixture transcripts, so the rows are shaped exactly like real ones.
 *
 * The failed one is NOT given a hand-written error message. It is set to `running` with a stale
 * heartbeat and then read, so `loadRun`'s own sweep decides it is dead and writes the reason.
 * The demonstration of the failure path is therefore the failure path.
 *
 * Writes the two ids to test/browser/seeded.json, which the suite and the screenshot script
 * read. QC_RUNNING / QC_FAILED in the environment override it.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const ROOT = join(import.meta.dirname, "..", "..");
for (const line of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim();
}

const { db, loadRun } = await import("../../lib/db/queries.ts");
const { canonicalise } = await import("../../lib/transcript/canonicalise.ts");

/**
 * `rubric_pack_sha256` is deliberately a "seed-" prefix rather than the real pack hash. The
 * idempotency index covers it, so a seeded row can never collide with — or be returned instead
 * of — a genuine run of the same transcript.
 */
async function seedRunning(fixture: string, callType: "coaching" | "kickoff", landed: string[], ageMs: number) {
  const body = canonicalise(readFileSync(join(ROOT, "fixtures", "transcripts", fixture), "utf8"));
  const sha = createHash("sha256").update(body, "utf8").digest("hex");
  const packSha = `seed-${sha.slice(0, 16)}`;

  await db().from("runs").delete().eq("transcript_sha256", sha).eq("rubric_pack_sha256", packSha);

  const beat = new Date(Date.now() - ageMs).toISOString();
  const insert = await db().from("runs").insert({
    call_type: callType, transcript_body: body, transcript_sha256: sha,
    rubric_pack_sha256: packSha, prompt_template_sha256: "seed",
    model_id: "anthropic/claude-opus-5", effort: "high", scorer_version: "seed",
    status: "running", started_at: new Date(Date.now() - ageMs - 40_000).toISOString(), heartbeat_at: beat,
  }).select("id").single();
  if (insert.error) throw insert.error;
  const id = (insert.data as { id: string }).id;

  if (landed.length) {
    const e = await db().from("run_dimensions").insert(landed.map((d) => ({
      run_id: id, dimension_id: d, score: 6, max_points: 10, bucket_matched: "Mid",
      disabled: false, not_evidenced: false, reasoning: "committed before this snapshot", evidence: [],
    })));
    if (e.error) throw e.error;
  }
  return id;
}

// Still going: five of twelve landed, heartbeat fresh.
const running = await seedRunning("kickoff-01.txt", "kickoff", ["D1", "D2", "D3", "D4", "D5"], 0);

// Dead: three landed, heartbeat older than STALE_MS. Reading it is what kills it.
const dying = await seedRunning("coaching-02.txt", "coaching", ["D1", "D2", "D3"], 216_000);
const swept = await loadRun(dying);
if (!swept?.sweptDead) throw new Error("the stale sweep did not fire — is STALE_MS still 120s?");

writeFileSync(
  join(import.meta.dirname, "seeded.json"),
  JSON.stringify({ running, failed: dying }, null, 2) + "\n",
  "utf8",
);

console.log(`QC_RUNNING=${running}`);
console.log(`QC_FAILED=${dying}`);
console.log("written to test/browser/seeded.json");
console.log(`\nswept by loadRun, not by hand:\n  ${swept.run.error_code}: ${swept.run.error_message}`);
