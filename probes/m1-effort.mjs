// M1 (BLOCKING) — does `reasoning.effort` work on Opus 5 through OpenRouter?
//
// The risk: OpenRouter's docs describe an `effort -> max_tokens x ratio -> budget_tokens`
// computation. `budget_tokens` was REMOVED from the Opus 5 family, so that path would 400.
// The endpoint lists BOTH `reasoning` and `reasoning_effort` in supported_parameters,
// which suggests a native translation instead. Nobody has verified which, for this model.
//
// Three outcomes, and they lead to different builds:
//   400                      -> effort is unusable; drop it from every call
//   200 but identical counts -> silent no-op; effort cannot be tuned, do not claim it
//   200 with differing counts-> works; tune depth per pass
//
// The prompt must actually REQUIRE reasoning, otherwise low and high both spend ~0 thinking
// tokens and the test proves nothing.

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { call, line, ROOT } from "./_client.mjs";

const PROMPT = `Three coaches each scored the same call. Ana scored it 8. Ben scored it two
points below Ana. Cleo scored it the average of Ana's and Ben's, rounded down. A cap then
reduced every score above 6 by one point. What did each coach's score become? Answer with
three numbers only, in the order Ana, Ben, Cleo.`;

const base = { messages: [{ role: "user", content: PROMPT }], max_tokens: 6000 };

const CASES = [
  ["control (no param)", {}],
  ["reasoning.effort=low", { reasoning: { effort: "low" } }],
  ["reasoning.effort=high", { reasoning: { effort: "high" } }],
  ["reasoning_effort=high", { reasoning_effort: "high" }],
];

const results = [];
for (const [label, extra] of CASES) {
  const r = await call({ ...base, ...extra }, { label });
  results.push(r);
  console.log(line(r));
  if (!r.ok) console.log(`     error: ${JSON.stringify(r.error ?? r.transport_error).slice(0, 300)}`);
}

// ---- verdict ----------------------------------------------------------------
const by = Object.fromEntries(results.map((r) => [r.label, r]));
const low = by["reasoning.effort=low"];
const high = by["reasoning.effort=high"];

const accepted = low?.ok && high?.ok;
const lowR = low?.usage?.reasoning_tokens ?? 0;
const highR = high?.usage?.reasoning_tokens ?? 0;
// "Materially different" — not just noise. Require the high run to exceed low by >25%.
const differs = accepted && highR > 0 && lowR > 0 && Math.abs(highR - lowR) / Math.max(lowR, highR) > 0.25;

let verdict;
if (!accepted) verdict = "REJECTED — the endpoint refuses reasoning.effort; drop it from every call";
else if (highR === 0 && lowR === 0) verdict = "NO-OP — accepted but zero reasoning tokens either way; effort is inert";
else if (!differs) verdict = `SILENT NO-OP — accepted, but low=${lowR} vs high=${highR} is not materially different; do not claim tunable depth`;
else verdict = `WORKS — low=${lowR} vs high=${highR} reasoning tokens; depth is genuinely tunable`;

console.log(`\nM1 VERDICT: ${verdict}`);
console.log(`alt shape (reasoning_effort): ${by["reasoning_effort=high"]?.ok ? "accepted" : "rejected"}`);
console.log(`answers: ${results.map((r) => JSON.stringify((r.content ?? "").trim().slice(0, 40))).join(" | ")}`);

mkdirSync(join(ROOT, "probes", "out"), { recursive: true });
writeFileSync(
  join(ROOT, "probes", "out", "m1-effort.json"),
  JSON.stringify({ probe: "M1", prompt: PROMPT, verdict, differs, results }, null, 2),
);
console.log("\nwrote probes/out/m1-effort.json");
