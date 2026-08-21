import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { prepare } from "../lib/transcript/canonicalise.ts";
import { parse } from "../lib/transcript/parse.ts";
import { createVerifier, MIN_QUOTE_WORDS, usable, needsRetry } from "../lib/scoring/evidence.ts";

const read = (n: string) =>
  readFileSync(join(import.meta.dirname, "..", "fixtures", "transcripts", `${n}.txt`), "utf8");

function verifierFor(name: string) {
  const { body } = prepare(read(name));
  const parsed = parse(body);
  return { body, parsed, v: createVerifier(body, parsed) };
}

test("a real quote verifies and its line is derived, not trusted", () => {
  const { v } = verifierFor("coaching-01");
  const r = v.verify({ quote: "Wednesday the 10th at four, yeah, I'm off that day, that one works" });
  assert.equal(r.status, "verified");
  assert.equal(r.line, 188);          // derived in code
  assert.equal(r.claimedLine, null);
  assert.equal(r.speaker, "Malik Osei");
});

test("A WRONG LINE NUMBER DOES NOT REJECT THE EVIDENCE — the whole point", () => {
  // Under the naive design (check the quote against the cited line) this returns not_found,
  // the dimension loses real evidence, and the score is floored for a behaviour that DID
  // occur. That failure looks like rigour, which is why it would survive a demo.
  const { v } = verifierFor("coaching-01");
  const r = v.verify({
    quote: "Wednesday the 10th at four, yeah, I'm off that day, that one works",
    line: 42, // off by 146
  });
  assert.equal(r.status, "verified_location_mismatch");
  assert.equal(r.line, 188);     // corrected
  assert.equal(r.claimedLine, 42); // and the model's claim retained for the audit trail
  assert.ok(usable([r]).length === 1, "location mismatch must still count as evidence");
});

test("an off-by-one line number is corrected silently rather than floored", () => {
  const { v } = verifierFor("coaching-01");
  const r = v.verify({
    quote: "I'll get you those times soon so we can get this locked on the calendar",
    line: 194,
  });
  assert.equal(r.status, "verified_location_mismatch");
  assert.equal(r.line, 193);
});

test("a fabricated quote is not found — no fuzzy rescue", () => {
  // Fuzzy/edit-distance matching was rejected deliberately: it would accept a
  // fabricated-but-on-topic quote, which is exactly the failure the evidence rule exists to
  // prevent.
  const { v } = verifierFor("coaching-01");
  const r = v.verify({
    quote: "I have already sent the calendar invite to your email address just now",
  });
  assert.equal(r.status, "not_found");
  assert.equal(r.line, null);
  assert.ok(needsRetry([r]));
});

test("a plausible near-miss paraphrase is still not found", () => {
  const { v } = verifierFor("coaching-01");
  // real line says "that one works"; this says "that one will work"
  const r = v.verify({ quote: "Wednesday the 10th at four, yeah, I'm off that day, that one will work" });
  assert.equal(r.status, "not_found");
});

test("quotes shorter than the uniqueness floor are rejected as too_short", () => {
  const { v } = verifierFor("coaching-01");
  const r = v.verify({ quote: "that one works" });
  assert.equal(r.status, "too_short");
  assert.equal(usable([r]).length, 0);
  assert.ok(!needsRetry([r]), "too_short needs a different instruction, not a retry");
  assert.ok(MIN_QUOTE_WORDS === 8);
});

test("normalisation absorbs smart quotes, dashes and whitespace runs", () => {
  const { v } = verifierFor("coaching-01");
  const base = "Wednesday the 10th at four, yeah, I'm off that day, that one works";
  for (const variant of [
    base.replace("I'm", "I’m"),          // curly apostrophe
    base.replace(/ /g, "  "),                  // doubled spaces
    base.toUpperCase(),                        // case
    base.replace("four,", "four,\n"),          // line break inside the quote
  ]) {
    assert.equal(v.verify({ quote: variant }).status, "verified", `variant failed: ${variant.slice(0, 40)}`);
  }
});

test("a quote spanning a line boundary still resolves to its starting line", () => {
  const { body, parsed, v } = verifierFor("coaching-01");
  const a = parsed.lines.find((l) => l.lineId === 187)!;
  const b = parsed.lines.find((l) => l.lineId === 188)!;
  const spanning = `${a.text.slice(-40)}\n[${b.speaker}]: ${b.text.slice(0, 40)}`;
  const r = v.verify({ quote: spanning });
  assert.equal(r.status, "verified");
  assert.equal(r.line, 187);
  assert.ok(body.includes(a.text.slice(-40)));
});

test("the exact field returns transcript text, not the model's rendering", () => {
  const { v } = verifierFor("coaching-01");
  const r = v.verify({ quote: "WEDNESDAY THE 10TH AT FOUR, YEAH, I'M OFF THAT DAY, THAT ONE WORKS" });
  assert.equal(r.status, "verified");
  // rendered evidence must be what the transcript says, in its own casing
  assert.match(r.exact, /^Wednesday the 10th at four, yeah, I'm off that day, that one works/);
});

test("every line of every fixture verifies against itself", () => {
  // The strongest available check: if any real line fails to verify, the normaliser has a bug.
  for (const name of ["kickoff-01", "kickoff-02", "coaching-01", "coaching-02"] as const) {
    const { parsed, v } = verifierFor(name);
    let checked = 0;
    for (const l of parsed.lines) {
      const words = l.text.trim().split(/\s+/);
      if (words.length < MIN_QUOTE_WORDS) continue;
      const quote = words.slice(0, 12).join(" ");
      const r = v.verify({ quote, line: l.lineId });
      assert.ok(
        r.status === "verified" || r.status === "verified_location_mismatch",
        `${name} L${l.lineId} failed to verify: ${r.status} — ${quote.slice(0, 50)}`,
      );
      checked++;
    }
    assert.ok(checked > 50, `${name} only checked ${checked} lines`);
  }
});

test("char offsets from a match round-trip to the same text", () => {
  const { body, v } = verifierFor("coaching-02");
  const r = v.verify({ quote: "we're not due a full diagnostics review this cycle" });
  assert.equal(r.status, "verified");
  assert.equal(body.slice(r.charStart!, r.charEnd!).toLowerCase().replace(/\s+/g, " "),
    "we're not due a full diagnostics review this cycle");
});
