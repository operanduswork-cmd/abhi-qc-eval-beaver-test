// Score one fixture and print the report. `npm run score -- <fixture> [--effort high]`
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { scoreTranscript } from "../lib/scoring/score.ts";
import { COACHING_PACK } from "../lib/rubric/coaching.ts";
import { KICKOFF_PACK } from "../lib/rubric/kickoff.ts";

const name = process.argv[2] ?? "coaching-01";
const effort = (process.argv.includes("--effort") ? process.argv[process.argv.indexOf("--effort") + 1] : "low") as "low" | "medium" | "high";

// load .env.local without a dependency
for (const line of readFileSync(join(import.meta.dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim();
}

const pack = name.startsWith("coaching") ? COACHING_PACK : KICKOFF_PACK;
const transcript = readFileSync(join(import.meta.dirname, "..", "fixtures", "transcripts", `${name}.txt`), "utf8");

console.log(`scoring ${name} (${pack.callType}, effort=${effort})\n`);
const t0 = Date.now();

const r = await scoreTranscript(pack, {
  callType: pack.callType, transcript, effort,
  onProgress: (ev) => { process.stdout.write(`  ${ev.done}/${ev.total} ${ev.dimensionId}   
`); },
});

console.log(" ".repeat(30) + "\r");
for (const d of r.dimensions) {
  const score = d.disabled ? "N/A" : `${d.score}/${d.maxPoints}`;
  const flags = [
    d.notEvidenced ? "not-evidenced" : "",
    d.requirements.filter((q) => q.state === "not_evidenced").length
      ? `${d.requirements.filter((q) => q.state === "not_evidenced").length}/${d.requirements.length} missing` : "",
    d.requirements.some((q) => q.state === "contradicted") ? "CONTRADICTED" : "",
  ].filter(Boolean).join(" ");
  console.log(`  ${d.id.padEnd(4)} ${d.title.slice(0, 32).padEnd(33)} ${score.padStart(7)}  ${flags}`);
}

console.log("");
for (const c of r.caps) {
  if (c.determination === "not_fired") continue;
  console.log(`  CAP ${c.id.padEnd(30)} ${c.determination.toUpperCase()}`);
}

console.log(`\n  RAW ${r.total.rawTotal}/${r.total.maxPossible}  ->  ${r.total.normalizedTotal}/100  ${r.total.band.name}`);
console.log(`  coach talk-share ${(r.talkShare.coachWordShare * 100).toFixed(1)}% (time ${(r.talkShare.coachTimeShareLow * 100).toFixed(1)}-${(r.talkShare.coachTimeShareHigh * 100).toFixed(1)}%)`);
const ev = r.dimensions.flatMap((d) => d.evidence);
const bad = ev.filter((e) => e.status === "not_found").length;
const mismatch = ev.filter((e) => e.status === "verified_location_mismatch").length;
console.log(`  evidence ${ev.length} quotes: ${ev.length - bad} verified, ${mismatch} line corrected, ${bad} NOT FOUND`);
console.log(`  cost $${r.cost.toFixed(4)}  in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
if (r.failures.length) console.log(`  FAILURES: ${r.failures.join(" | ")}`);

mkdirSync(join(import.meta.dirname, "out"), { recursive: true });
writeFileSync(join(import.meta.dirname, "out", `${name}.json`), JSON.stringify(r, null, 2));
console.log(`\n  wrote eval/out/${name}.json`);
