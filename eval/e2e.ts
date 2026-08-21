// The real thing: start a run, let the worker score it, read it back through the same path the
// page uses — and diff every dimension against the previously saved run to measure determinism.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
for (const line of readFileSync(join(import.meta.dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim();
}
const { start, execute, contractFor } = await import("../lib/run.ts");
const { db } = await import("../lib/db/queries.ts");

const name = process.argv[2] ?? "coaching-01";
const callType = name.startsWith("coaching") ? "coaching" as const : "kickoff" as const;
const transcript = readFileSync(join(import.meta.dirname, "..", "fixtures", "transcripts", `${name}.txt`), "utf8");

console.log(`e2e: ${name}\n`);
const t0 = Date.now();
const s = await start({ callType, transcript });
if (!s.ok || !s.runId) { console.error("  REFUSED: " + s.message); process.exit(1); }
console.log(`  run id ${s.runId}  (${Date.now() - t0}ms, ${s.created ? "new" : "reused"})`);

if (s.created) {
  console.log("  scoring in the worker...");
  await execute(s.runId, callType, transcript);
}

const c = await contractFor(s.runId);
if (!c) { console.error("  run vanished"); process.exit(1); }
console.log(`\n  status: ${c.status}`);
if (c.status === "failed") { console.error(`  ${c.failureReason}`); process.exit(1); }
console.log(`  ${c.total.rawTotal}/${c.total.maxPossible} -> ${c.total.normalizedTotal}/100 ${c.total.band.name}`);
console.log(`  evidence rows: ${c.dimensions.reduce((a, d) => a + d.evidence.length, 0)}`);
console.log(`  oneThing: ${c.oneThing ? "yes" : "MISSING"} · brief: ${c.brief ? "yes" : "MISSING"} · redFlags: ${c.redFlags?.length ?? "MISSING"}`);

// ---- determinism: diff against the previously saved run -------------------
const priorPath = join(import.meta.dirname, "out", `${name}.json`);
let prior: any = null;
try { prior = JSON.parse(readFileSync(priorPath, "utf8")); } catch {}
if (prior?.dimensions) {
  console.log(`\n  DETERMINISM vs the earlier run of the same transcript`);
  let same = 0, moved = 0;
  for (const d of c.dimensions) {
    const p = prior.dimensions.find((x: any) => x.id === d.id);
    if (!p) continue;
    if (p.score === d.score) { same++; }
    else { moved++; console.log(`    ${d.id} ${p.score} -> ${d.score}`); }
  }
  console.log(`    ${same}/${same + moved} dimensions identical` + (moved ? `, ${moved} moved` : " — every score reproduced"));
  console.log(`    total ${prior.total.normalizedTotal} -> ${c.total.normalizedTotal}`);
}

writeFileSync(join(import.meta.dirname, "out", `${name}.e2e.json`), JSON.stringify(c, null, 2));
console.log(`\n  wrote eval/out/${name}.e2e.json`);
await db().from("runs").delete().eq("id", s.runId);
console.log("  (test run removed from the database)");
