// Add oneThing / brief / redFlags to an ALREADY-SCORED run. One API call, no re-scoring.
//   npm run synth -- coaching-01
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prepare, numbered } from "../lib/transcript/canonicalise.ts";
import { parse } from "../lib/transcript/parse.ts";
import { buildPrefix } from "../lib/scoring/prompt.ts";
import { synthesize } from "../lib/scoring/synthesize.ts";
import { COACHING_PACK } from "../lib/rubric/coaching.ts";
import { KICKOFF_PACK } from "../lib/rubric/kickoff.ts";
import { checkBudget, estimateRunCost } from "../lib/budget.ts";

const name = process.argv[2] ?? "coaching-01";
for (const line of readFileSync(join(import.meta.dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim();
}

const pack = name.startsWith("coaching") ? COACHING_PACK : KICKOFF_PACK;
const scoredPath = join(import.meta.dirname, "out", `${name}.json`);
const result = JSON.parse(readFileSync(scoredPath, "utf8"));
const transcript = readFileSync(join(import.meta.dirname, "..", "fixtures", "transcripts", `${name}.txt`), "utf8");

const canonical = prepare(transcript);
const parsed = parse(canonical.body);

const est = estimateRunCost(canonical.body.length, 1); // one call only
const budget = await checkBudget(est);
if (!budget.ok) { console.error(`REFUSED: ${budget.message}`); process.exit(1); }
console.log(`synthesising ${name} (est $${est.toFixed(2)}, $${budget.remaining?.toFixed(2)} left)\n`);

const s = await synthesize(result, canonical.body, parsed, {
  prefix: buildPrefix(pack, numbered(canonical.body)),
  effort: "low",
});

if (s.error) { console.error(`  FAILED: ${s.error}`); process.exit(1); }

console.log(`  THE ONE THING  ${s.oneThing?.text}`);
console.log(`                 lifts ${s.oneThing?.dimensionId} to ${s.oneThing?.wouldScore}`);
console.log(`                 total ${result.total.normalizedTotal} -> ${s.projectedTotal} (computed, not asserted)`);
console.log(`\n  THE BRIEF\n    ${s.brief?.replace(/\n/g, "\n    ")}`);
console.log(`\n  RED FLAGS (${s.redFlags?.length ?? 0}, all line-verified)`);
for (const f of s.redFlags ?? []) console.log(`    [${f.severity}] L${f.line}  ${f.text}`);
console.log(`\n  cost $${s.cost.toFixed(4)}`);

writeFileSync(scoredPath, JSON.stringify({ ...result, ...s }, null, 2));
console.log(`  merged into eval/out/${name}.json`);
