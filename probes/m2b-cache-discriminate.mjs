// M2b — WHAT breaks the cache: the schema name, the enum, or both?
//
// M2 established that changing the whole schema drops cached_tokens to 0. That is only
// actionable if we know which part is responsible:
//
//   - if only the ENUM matters -> dimensions sharing an enum share a schema and cache
//     together. Coaching has many 5-point dimensions; grouping could turn 12 cache misses
//     into 3-4, at zero cost to the enum constraint M3 just proved is load-bearing.
//   - if the NAME alone matters -> use one shared name and vary only the enum.
//   - if both matter -> grouping by identical enum is the only lever.
//
// Four calls against one shared prefix:
//   W  name=x enum=E1   write
//   1  name=x enum=E1   identical            (control, must cache)
//   2  name=y enum=E1   NAME differs only
//   3  name=x enum=E2   ENUM differs only

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { call, ROOT } from "./_client.mjs";

const raw = readFileSync(join(ROOT, "fixtures", "transcripts", "kickoff-02.txt"), "utf8");
const canonical = raw.replace(/^﻿/, "").replace(/\r\n?/g, "\n").normalize("NFC")
  .split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n+$/, "");
const numbered = canonical.split("\n").map((l, i) => `L${i + 1}: ${l}`).join("\n");

// distinct prefix from M2 so we are not reading M2's still-warm 1h cache
const PREFIX = `M2b discrimination probe. Score the call against the stated dimension.
Every claim must rest on verbatim transcript lines.

TRANSCRIPT (line-numbered):
${numbered}`;

const E1 = [10, 9, 8, 6, 4, 1, 0];
const E2 = [5, 4.5, 2.5, 1, 0];

const schema = (name, enumVals) => ({
  type: "json_schema",
  json_schema: {
    name, strict: true,
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

const ask = (s, label) =>
  call({
    messages: [{ role: "user", content: [
      { type: "text", text: PREFIX, cache_control: { type: "ephemeral", ttl: "1h" } },
      { type: "text", text: "Score the dimension. Cite verbatim lines." },
    ] }],
    response_format: s,
    reasoning: { effort: "low" },
    max_tokens: 1200,
  }, { label });

const show = (r) => {
  const u = r.usage;
  console.log(`  ${r.label.padEnd(30)} HTTP ${r.http}  in=${String(u.prompt_tokens).padStart(5)} cached=${String(u.cached_tokens).padStart(5)}  $${(u.cost ?? 0).toFixed(5)}`);
  return u.cached_tokens ?? 0;
};

const W  = await ask(schema("dim_x", E1), "W  name=x enum=E1 (write)");  show(W);
const c1 = show(await ask(schema("dim_x", E1), "1  name=x enum=E1 identical"));
const c2 = show(await ask(schema("dim_y", E1), "2  name=y enum=E1 NAME differs"));
const c3 = show(await ask(schema("dim_x", E2), "3  name=x enum=E2 ENUM differs"));

const nameBreaks = c1 > 0 && c2 === 0;
const enumBreaks = c1 > 0 && c3 === 0;

let verdict;
if (c1 === 0) verdict = "INCONCLUSIVE - the control did not cache";
else if (nameBreaks && enumBreaks) verdict = "BOTH name and enum invalidate the cache. Only dimensions with an IDENTICAL schema (same name AND same enum) can share a cache group.";
else if (enumBreaks && !nameBreaks) verdict = "Only the ENUM invalidates. Give every dimension the same schema NAME and group by shared enum - fewer distinct enums = fewer cache misses.";
else if (nameBreaks && !enumBreaks) verdict = "Only the NAME invalidates. Use ONE shared schema name across all 12 dimensions and the per-dimension enum stays free.";
else verdict = "NEITHER invalidates in isolation - re-check M2, something else differed there.";

console.log(`\nM2b VERDICT: ${verdict}`);
console.log(`  control=${c1}  name-differs=${c2}  enum-differs=${c3}`);

mkdirSync(join(ROOT, "probes", "out"), { recursive: true });
writeFileSync(join(ROOT, "probes", "out", "m2b-cache-discriminate.json"),
  JSON.stringify({ probe: "M2b", verdict, control: c1, name_differs: c2, enum_differs: c3, name_breaks: nameBreaks, enum_breaks: enumBreaks }, null, 2));
console.log("wrote probes/out/m2b-cache-discriminate.json");
