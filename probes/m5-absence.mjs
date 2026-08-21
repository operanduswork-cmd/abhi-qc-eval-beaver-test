// M5 — the absence-detection baseline. This is the headline evidence.
//
// coaching-01 is the trap. It is a warm, likeable call, and at the close it does this:
//
//   L185  Priya: "Let's just lock it in right now instead of me chasing you down later..."
//   L188  Malik: "Wednesday the 10th at four, yeah, I'm off that day... Let's lock that in."
//   L193  Priya: "...I'll get you those times soon so we can get this locked on the calendar."
//
// Coaching D10 is 0/5 NON-RECOVERABLE if the next call was not booked live. A system that
// reads mood scores this Strong. A correct system reports `indeterminate`, quotes BOTH
// sides, and says which branch it scored.
//
// Ten runs at full context. The question is not "can it do this once" but "how often".
// That number is simultaneously the reproducibility figure and a direct exercise of the
// adversarial case, and it decides whether the prompt design needs to change.
//
// The cap is phrased as an ENUMERATION, never a negative (correction #5): asking "was it
// booked?" invites a yes/no guess; asking "list EVERY booking instance" makes absence a
// spot-checkable empty array. Determination is emitted LAST (correction #4).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { call, ROOT } from "./_client.mjs";

const raw = readFileSync(join(ROOT, "fixtures", "transcripts", "coaching-01.txt"), "utf8");
const canonical = raw.replace(/^﻿/, "").replace(/\r\n?/g, "\n").normalize("NFC")
  .split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n+$/, "");
const lines = canonical.split("\n");
const numbered = lines.map((l, i) => `L${i + 1}: ${l}`).join("\n");

const N = 10;

const SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "cap_determination", strict: true,
    schema: {
      type: "object",
      properties: {
        booking_evidence: {
          type: "array",
          items: { type: "object", properties: {
            quote: { type: "string" }, line: { type: "number" }, speaker: { type: "string" },
          }, required: ["quote", "line", "speaker"], additionalProperties: false },
        },
        counter_evidence: {
          type: "array",
          items: { type: "object", properties: {
            quote: { type: "string" }, line: { type: "number" }, speaker: { type: "string" },
          }, required: ["quote", "line", "speaker"], additionalProperties: false },
        },
        reasoning: { type: "string" },
        determination: { type: "string", enum: ["booked_live", "not_booked", "indeterminate"] },
      },
      required: ["booking_evidence", "counter_evidence", "reasoning", "determination"],
      additionalProperties: false,
    },
  },
};

const PREFIX = `You are auditing a coaching call transcript for one specific factual question.
Every claim must rest on verbatim transcript lines. Never infer from tone, warmth, or rapport.

TRANSCRIPT (line-numbered):
${numbered}`;

const QUESTION = `Resolve this cap predicate: "Next call NOT booked live during the call."

1. In booking_evidence, list EVERY instance where a next call was booked live during this
   call - a specific date/time agreed, a link used, or a confirmation given. Verbatim quotes
   of at least 8 words, with the line number. Empty array if there are none.
2. In counter_evidence, list EVERY statement that contradicts or walks back a booking, or
   that defers scheduling to after the call. Same format. Empty array if there are none.
3. Then state your determination. Use "indeterminate" when both arrays are non-empty and
   they genuinely conflict.`;

const one = (i) =>
  call({
    messages: [{ role: "user", content: [
      { type: "text", text: PREFIX, cache_control: { type: "ephemeral", ttl: "1h" } },
      { type: "text", text: QUESTION },
    ] }],
    response_format: SCHEMA,
    reasoning: { effort: "high" },
    max_tokens: 4000,
  }, { label: `run-${String(i + 1).padStart(2, "0")}` });

console.log(`coaching-01: ${lines.length} lines, ~${Math.round(PREFIX.length / 4)} tokens\n`);

// first call sequentially so it writes the cache; the rest can then read it
const results = [await one(0)];
process.stdout.write(".");
for (let i = 1; i < N; i += 3) {
  const batch = await Promise.all(Array.from({ length: Math.min(3, N - i) }, (_, k) => one(i + k)));
  results.push(...batch);
  process.stdout.write(".".repeat(batch.length));
}
console.log("\n");

const CONTRA = [185, 188, 193];
const analysed = results.map((r) => {
  let d = null, err = null;
  try { d = JSON.parse(r.content ?? ""); } catch (e) { err = String(e).slice(0, 80); }
  const allLines = [...(d?.booking_evidence ?? []), ...(d?.counter_evidence ?? [])].map((e) => e.line);
  const quotedBoth = allLines.includes(188) && allLines.includes(193);
  return {
    label: r.label, ok: r.ok, err,
    determination: d?.determination ?? null,
    booking_lines: (d?.booking_evidence ?? []).map((e) => e.line),
    counter_lines: (d?.counter_evidence ?? []).map((e) => e.line),
    quoted_188_and_193: quotedBoth,
    contradiction_lines_seen: CONTRA.filter((l) => allLines.includes(l)),
    cached: r.usage?.cached_tokens ?? 0,
    out: r.usage?.completion_tokens ?? 0,
    reasoning_tokens: r.usage?.reasoning_tokens ?? 0,
    cost: r.usage?.cost ?? 0,
  };
});

for (const a of analysed) {
  console.log(`  ${a.label}  ${String(a.determination).padEnd(14)} booking=[${a.booking_lines}] counter=[${a.counter_lines}] both188+193=${a.quoted_188_and_193 ? "YES" : "no "} cached=${String(a.cached).padStart(5)} out=${String(a.out).padStart(4)}`);
}

const dist = {};
for (const a of analysed) dist[String(a.determination)] = (dist[String(a.determination)] ?? 0) + 1;
const caughtBoth = analysed.filter((a) => a.quoted_188_and_193).length;
const indet = analysed.filter((a) => a.determination === "indeterminate").length;
const bookedLive = analysed.filter((a) => a.determination === "booked_live").length;
const correct = analysed.filter((a) => a.determination === "indeterminate" && a.quoted_188_and_193).length;
const totalCost = analysed.reduce((s, a) => s + a.cost, 0);
const avgOut = Math.round(analysed.reduce((s, a) => s + a.out, 0) / N);
const avgReasoning = Math.round(analysed.reduce((s, a) => s + a.reasoning_tokens, 0) / N);

console.log(`\ndeterminations: ${JSON.stringify(dist)}`);
console.log(`quoted BOTH L188 and L193:      ${caughtBoth}/${N}`);
console.log(`determination = indeterminate:  ${indet}/${N}`);
console.log(`determination = booked_live:    ${bookedLive}/${N}   <- the failure mode the transcript exists to catch`);
console.log(`FULLY CORRECT (indeterminate AND both quoted): ${correct}/${N}`);
console.log(`\ncost $${totalCost.toFixed(4)} total | avg output ${avgOut} tok (${avgReasoning} reasoning) per call`);

const verdict =
  correct >= 9 ? `STRONG — ${correct}/${N} fully correct. The prompt design holds; proceed.`
  : correct >= 7 ? `ACCEPTABLE — ${correct}/${N}. Usable, but report the rate honestly rather than claiming determinism.`
  : `WEAK — only ${correct}/${N}. The prompt design must change BEFORE the scoring pipeline is written.`;
console.log(`\nM5 VERDICT: ${verdict}`);

mkdirSync(join(ROOT, "probes", "out"), { recursive: true });
writeFileSync(join(ROOT, "probes", "out", "m5-absence.json"),
  JSON.stringify({ probe: "M5", transcript: "coaching-01", n: N, verdict, distribution: dist,
    quoted_both: caughtBoth, indeterminate: indet, booked_live: bookedLive, fully_correct: correct,
    total_cost: totalCost, avg_output_tokens: avgOut, avg_reasoning_tokens: avgReasoning,
    question: QUESTION, results: analysed }, null, 2));
console.log("wrote probes/out/m5-absence.json");
