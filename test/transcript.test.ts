import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { canonicalise, prepare, numbered } from "../lib/transcript/canonicalise.ts";
import { parse, likelyCoach, countWords } from "../lib/transcript/parse.ts";
import { talkShare, resolveThreshold } from "../lib/transcript/talkshare.ts";

const FIXTURES = join(import.meta.dirname, "..", "fixtures", "transcripts");
const read = (name: string) => readFileSync(join(FIXTURES, `${name}.txt`), "utf8");

/**
 * Expected values measured independently during research, before any of this code existed.
 * They are the reason these tests mean something: if the implementation drifts, it drifts
 * away from numbers that were established separately rather than derived from itself.
 */
const EXPECTED = {
  // `coachLines` are the figures recorded in research as "turns" — they are LINES per
  // speaker. Measuring here proved the two differ, which is precisely why the parser tracks
  // lineId and turnId separately. coachTurns is the real turn count.
  "kickoff-01":  { coach: "Dana Whitlock", coachLines: 74,  coachTurns: 73,  coachWords: 3996, share: 0.6753 },
  "kickoff-02":  { coach: "Ivan Petrov",   coachLines: 64,  coachTurns: 63,  coachWords: 1909, share: 0.7309 },
  "coaching-01": { coach: "Priya Raman",   coachLines: 98,  coachTurns: 98,  coachWords: 4042, share: 0.6656 },
  "coaching-02": { coach: "Marcus Reid",   coachLines: 175, coachTurns: 170, coachWords: 6913, share: 0.6347 },
} as const;

// ---------------------------------------------------------------- canonicalise

test("canonicalise is idempotent", () => {
  for (const name of Object.keys(EXPECTED)) {
    const once = canonicalise(read(name));
    assert.equal(canonicalise(once), once, `${name} changed on a second pass`);
  }
});

test("CRLF and LF copies of the same transcript hash identically", () => {
  // The whole point: two research reports disagreed on the fixtures' line endings, and
  // canonicalising first makes the disagreement irrelevant.
  for (const name of Object.keys(EXPECTED)) {
    const lf = read(name).replace(/\r\n?/g, "\n");
    const crlf = lf.replace(/\n/g, "\r\n");
    const cr = lf.replace(/\n/g, "\r");
    assert.equal(prepare(crlf).sha256, prepare(lf).sha256, `${name} CRLF != LF`);
    assert.equal(prepare(cr).sha256, prepare(lf).sha256, `${name} CR != LF`);
  }
});

test("canonicalise strips BOM, trailing whitespace and trailing blank lines", () => {
  const got = canonicalise("﻿[A]: hello   \r\n[B]: there\t\r\n\r\n\r\n");
  assert.equal(got, "[A]: hello\n[B]: there");
});

test("hash changes when content changes", () => {
  const a = prepare("[A]: hello");
  const b = prepare("[A]: hellp");
  assert.notEqual(a.sha256, b.sha256);
});

// ---------------------------------------------------------------------- parse

test("all four fixtures parse 100% cleanly", () => {
  for (const name of Object.keys(EXPECTED)) {
    const { body } = prepare(read(name));
    const p = parse(body);
    assert.deepEqual(p.unmatched, [], `${name} has non-matching lines`);
    assert.equal(p.speakers.length, 2, `${name} does not have exactly 2 speakers`);
  }
});

test("speaker, turn count and word count match the independently measured values", () => {
  for (const [name, exp] of Object.entries(EXPECTED)) {
    const { body } = prepare(read(name));
    const p = parse(body);
    assert.equal(likelyCoach(p), exp.coach, `${name} coach`);
    const mine = p.lines.filter((l) => l.speaker === exp.coach);
    assert.equal(mine.length, exp.coachLines, `${name} coach lines`);
    assert.equal(new Set(mine.map((l) => l.turnId)).size, exp.coachTurns, `${name} coach turns`);
    const words = mine.reduce((a, l) => a + countWords(l.text), 0);
    assert.equal(words, exp.coachWords, `${name} coach words`);
  }
});

test("lineId and turnId diverge exactly where a speaker takes two lines in a row", () => {
  // Research recorded six same-speaker runs in coaching-02 and implied it was unique in
  // that. Measuring all four shows kickoff-01 and kickoff-02 each have one too, so ANY
  // turn-based arithmetic drifts on three of the four fixtures, not one. This is the
  // concrete reason lineId and turnId are separate fields rather than the same number.
  const RUNS: Record<string, number[]> = {
    "kickoff-01": [90],
    "kickoff-02": [22],
    "coaching-01": [],
    "coaching-02": [46, 119, 146, 225, 273, 299],
  };

  for (const [name, runs] of Object.entries(RUNS)) {
    const p = parse(prepare(read(name)).body);
    assert.deepEqual(p.sameSpeakerRuns, runs, `${name} same-speaker runs`);
    assert.equal(p.turnCount, p.lines.length - runs.length, `${name} turns != lines - runs`);

    // each recorded position must genuinely share a speaker with the line before it
    for (const lineId of runs) {
      const cur = p.lines.find((l) => l.lineId === lineId)!;
      const prev = p.lines.find((l) => l.lineId === lineId - 1)!;
      assert.equal(cur.speaker, prev.speaker, `${name} L${lineId} is not a continuation`);
      assert.equal(cur.turnId, prev.turnId, `${name} L${lineId} should share a turnId`);
    }
  }
});

test("char offsets round-trip back to the exact line text", () => {
  const { body } = prepare(read("coaching-01"));
  for (const l of parse(body).lines) {
    assert.equal(body.slice(l.charStart, l.charEnd), `[${l.speaker}]: ${l.text}`);
  }
});

test("line numbering puts coaching-01's contradiction where the probe found it", () => {
  // M5 returned these ten times out of ten. They are load-bearing for the adversarial case.
  const { body } = prepare(read("coaching-01"));
  const n = numbered(body).split("\n");
  assert.match(n[184]!, /^L185: \[Priya Raman\]: Let's just lock it in right now/);
  assert.match(n[186]!, /^L187: \[Priya Raman\]: Okay, what about Wednesday the 10th/);
  assert.match(n[187]!, /^L188: \[Malik Osei\]: Wednesday the 10th at four/);
  assert.match(n[192]!, /I'll get you those times soon/);
});

// ------------------------------------------------------------------ talkshare

test("word share matches measurement, and char share tracks it closely", () => {
  for (const [name, exp] of Object.entries(EXPECTED)) {
    const p = parse(prepare(read(name)).body);
    const ts = talkShare(p, exp.coach);
    assert.ok(Math.abs(ts.coachWordShare - exp.share) < 0.0005,
      `${name} word share ${ts.coachWordShare} != ${exp.share}`);
    // Research claimed "within 0.6pp on all four fixtures". Measured here, the true maximum
    // is 0.74pp (kickoff-02). The claim was very nearly right and would still have been
    // wrong in the README, so the bound asserted is the measured one.
    assert.ok(Math.abs(ts.coachWordShare - ts.coachCharShare) < 0.008,
      `${name} word/char share diverge by more than 0.8pp`);
  }
});

test("time-share interval always contains the word share", () => {
  // At r = 1 the formula must collapse to plain word share, so the point estimate cannot
  // fall outside its own interval.
  for (const [name, exp] of Object.entries(EXPECTED)) {
    const ts = talkShare(parse(prepare(read(name)).body), exp.coach);
    assert.ok(ts.coachTimeShareLow <= ts.coachWordShare && ts.coachWordShare <= ts.coachTimeShareHigh,
      `${name} interval [${ts.coachTimeShareLow}, ${ts.coachTimeShareHigh}] excludes ${ts.coachWordShare}`);
  }
});

test("kickoff-02 is indeterminate at the 70% cap — the boundary the grader will check", () => {
  // 73.1% by words trips >70%. But at a plausible speaking-rate asymmetry the time share
  // falls below 70% and the cap does not fire. Reporting a single number here would be
  // asserting something the transcript cannot support.
  const ts = talkShare(parse(prepare(read("kickoff-02")).body), "Ivan Petrov");
  const r = resolveThreshold(ts, 0.70);
  assert.equal(r.verdict, "indeterminate");
  assert.ok(r.timeShareLow < 0.70, "low bound should sit below the threshold");
  assert.ok(r.timeShareHigh > 0.70, "high bound should sit above the threshold");
  assert.match(r.statement, /NOT applied/);
});

test("coaching transcripts sit clearly under the 75% cap", () => {
  for (const name of ["coaching-01", "coaching-02"] as const) {
    const ts = talkShare(parse(prepare(read(name)).body), EXPECTED[name].coach);
    assert.equal(resolveThreshold(ts, 0.75).verdict, "not_fired", `${name} at 75%`);
  }
});

test("a genuine monologue fires the cap outright", () => {
  const body = prepare("[Coach]: " + "word ".repeat(400) + "\n[Client]: ok").body;
  const ts = talkShare(parse(body), "Coach");
  assert.equal(resolveThreshold(ts, 0.75).verdict, "fired");
});

// ------------------------------------------------- what the format actually carries

test("movement markers are detected — coaching-01 has live movement, coaching-02 does not", () => {
  // Research asserted "physical movement leaves no trace in a transcript". False: the
  // recorder emits [exertion], [stepping], [breathing], [shuffling] inline. This is direct
  // evidence for coaching D4 detection criterion 1, not narration.
  const c01 = parse(prepare(read("coaching-01")).body);
  assert.ok(c01.movementLines.length >= 8, `expected movement lines, got ${c01.movementLines}`);
  assert.ok(c01.movementLines.every((l) => l >= 48 && l <= 90), "movement clusters in the coaching block");

  // coaching-02 is the D4-DISABLED eval target. Its only markers are [inaudible] audio
  // dropouts, so the disable path survives this correction.
  const c02 = parse(prepare(read("coaching-02")).body);
  assert.deepEqual(c02.movementLines, [], "coaching-02 must have no movement markers");
  const markers = new Set(c02.lines.flatMap((l) => l.markers));
  assert.deepEqual([...markers], ["inaudible"]);
});

test("interruption is observable — cut-offs exist and are acknowledged verbatim", () => {
  // Research asserted "no overlap markers, strictly alternating turns, so interruption is
  // unobservable". All three premises are false.
  for (const name of ["kickoff-01", "kickoff-02", "coaching-01", "coaching-02"] as const) {
    const p = parse(prepare(read(name)).body);
    assert.ok(p.cutOffLines.length > 0, `${name} should have mid-sentence cut-offs`);
  }
  const c02 = parse(prepare(read("coaching-02")).body);
  const l244 = c02.lines.find((l) => l.lineId === 244)!;
  assert.match(l244.text, /I interrupted you/);
  assert.ok(c02.cutOffLines.includes(243), "L243 is cut off mid-sentence");
});

test("no transcript carries a timestamp — the one unobservability claim that survives", () => {
  // D12's minute targets therefore cannot be measured and need a documented proxy.
  for (const name of ["kickoff-01", "kickoff-02", "coaching-01", "coaching-02"] as const) {
    const p = parse(prepare(read(name)).body);
    for (const l of p.lines) {
      assert.ok(!/^\s*\[?\d{1,2}:\d{2}/.test(l.text), `${name} L${l.lineId} looks timestamped`);
    }
  }
});
