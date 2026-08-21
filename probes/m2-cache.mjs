// M2 — does prompt caching engage WITH per-dimension schemas attached?
//
// These two features interact and nobody has verified it through OpenRouter. Structured
// outputs inject an extra system prompt describing the format, and that invalidates the
// cache if it changes. Render order is tools -> system -> messages, so twelve DIFFERENT
// per-dimension schemas may sit AHEAD of the transcript in the prefix and shatter the
// shared cache entirely — turning one cached transcript into twelve uncached ones.
//
// Three calls isolate the two questions:
//   A   D1 schema + transcript                 -> writes the cache
//   A'  D1 schema + identical transcript       -> does caching work AT ALL?
//   B   D3 schema (different) + same transcript-> does a schema change break it?
//
// Uses kickoff-02, the SMALLEST transcript (~4.2-4.6k tokens), because the documented
// minimum cacheable prefix is 1,024-4,096. A silent non-cache there is easy to miss, and
// if the floor is cleared here it is cleared everywhere.
//
// ttl "1h", not the 5-minute default: the reproducibility demo is a re-run of the same
// transcript minutes apart, and 5m is exactly the Vercel maxDuration.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { call, ROOT } from "./_client.mjs";

const raw = readFileSync(join(ROOT, "fixtures", "transcripts", "kickoff-02.txt"), "utf8");
// canonicalise the same way the real pipeline will, then line-number
const canonical = raw.replace(/^﻿/, "").replace(/\r\n?/g, "\n").normalize("NFC")
  .split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n+$/, "");
const numbered = canonical.split("\n").map((l, i) => `L${i + 1}: ${l}`).join("\n");

// The stable, shared prefix: preamble + transcript. This is what must stay cached.
const PREFIX = `You are scoring a coaching kick-off call against a fixed rubric.
Every claim must rest on verbatim transcript lines. Absent behaviour is stated, never inferred.

TRANSCRIPT (line-numbered):
${numbered}`;

const schemaFor = (name, enumVals) => ({
  type: "json_schema",
  json_schema: {
    name,
    strict: true,
    schema: {
      type: "object",
      properties: {
        evidence: { type: "array", items: { type: "string" } },
        reasoning: { type: "string" },
        score: { type: "number", enum: enumVals },
      },
      required: ["evidence", "reasoning", "score"],
      additionalProperties: false,
    },
  },
});

const D1 = schemaFor("d1_pre_call_preparation", [10, 9, 8, 6, 4, 1, 0]);
const D3 = schemaFor("d3_agenda_framing", [5, 4.5, 2.5, 1, 0]);

const ask = (schema, question, label) =>
  call(
    {
      messages: [
        {
          role: "user",
          content: [
            // the cache breakpoint sits at the END of the shared prefix
            { type: "text", text: PREFIX, cache_control: { type: "ephemeral", ttl: "1h" } },
            { type: "text", text: question },
          ],
        },
      ],
      response_format: schema,
      reasoning: { effort: "low" },
      max_tokens: 2000,
    },
    { label },
  );

const Q1 = "Score Dimension 1 - Pre-Call Preparation (10 pts). Cite verbatim lines.";
const Q3 = "Score Dimension 3 - Agenda Framing (5 pts). Cite verbatim lines.";

const show = (r) => {
  const u = r.usage;
  console.log(
    `  ${r.label.padEnd(28)} HTTP ${r.http}  in=${String(u.prompt_tokens).padStart(6)} ` +
    `cached=${String(u.cached_tokens).padStart(6)}  out=${String(u.completion_tokens).padStart(5)} ` +
    `cost=$${(u.cost ?? 0).toFixed(5)}  ${r.resolved_provider}`,
  );
  if (!r.ok) console.log(`     error: ${JSON.stringify(r.error ?? r.transport_error).slice(0, 300)}`);
};

console.log(`prefix: ~${Math.round(PREFIX.length / 4)} tokens estimated (${canonical.split("\n").length} lines)\n`);

// STRICTLY SEQUENTIAL — A must fully land before A' can read its cache.
const A = await ask(D1, Q1, "A  D1 schema (write)"); show(A);
const A2 = await ask(D1, Q1, "A' D1 schema (same)"); show(A2);
const B = await ask(D3, Q3, "B  D3 schema (differs)"); show(B);

const sameSchemaCached = A2.usage.cached_tokens ?? 0;
const diffSchemaCached = B.usage.cached_tokens ?? 0;

let verdict;
if (!A.ok || !A2.ok || !B.ok) verdict = "INCONCLUSIVE - one or more calls failed";
else if (sameSchemaCached === 0) verdict = "CACHING DOES NOT ENGAGE AT ALL - even an identical schema missed. Check the prefix clears the 1,024-4,096 token floor.";
else if (diffSchemaCached === 0) verdict = `SCHEMA BREAKS THE CACHE - identical schema cached ${sameSchemaCached} tokens, different schema cached 0. Twelve per-dimension schemas = twelve uncached transcripts. Do NOT sacrifice the enum; try moving the transcript ahead of the schema region, else accept ~$1/run and say so.`;
else verdict = `SHIP AS DESIGNED - different schema still cached ${diffSchemaCached} tokens (identical schema: ${sameSchemaCached}). Per-dimension enums cost nothing in cache terms.`;

console.log(`\nM2 VERDICT: ${verdict}`);

mkdirSync(join(ROOT, "probes", "out"), { recursive: true });
writeFileSync(
  join(ROOT, "probes", "out", "m2-cache.json"),
  JSON.stringify({ probe: "M2", transcript: "kickoff-02", prefix_chars: PREFIX.length, verdict, same_schema_cached: sameSchemaCached, diff_schema_cached: diffSchemaCached, results: [A, A2, B] }, null, 2),
);
console.log("wrote probes/out/m2-cache.json");
