import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { DIMENSION_ICONS, iconFor, iconSvg } from "../lib/report/icons.ts";
import { measure } from "../lib/transcript/measure.ts";
import { COACHING_PACK } from "../lib/rubric/coaching.ts";
import { KICKOFF_PACK } from "../lib/rubric/kickoff.ts";

const read = (n: string) =>
  readFileSync(join(import.meta.dirname, "..", "fixtures", "transcripts", `${n}.txt`), "utf8");

// ---------------------------------------------------------------------- icons

test("every dimension of BOTH rubrics has its own mark", () => {
  for (const pack of [COACHING_PACK, KICKOFF_PACK]) {
    for (const d of pack.dimensions) {
      const mark = iconFor(pack.callType, d.id);
      assert.ok(mark, `${pack.callType}:${d.id} (${d.title}) has no icon`);
      assert.ok(mark!.paths.length > 0, `${pack.callType}:${d.id} has an empty icon`);
    }
  }
});

test("the two rubrics do not share a mark at the same id", () => {
  // They did once — the keys were "D1".."D12" and both packs read the same twelve, so coaching
  // D1 "Check-In & Connection" and kickoff D1 "Pre-Call Preparation" wore the same two speech
  // bubbles. The id is positional; it carries no meaning across packs.
  for (const d of COACHING_PACK.dimensions) {
    const a = iconFor("coaching", d.id)!;
    const b = iconFor("kickoff", d.id)!;
    assert.notDeepEqual(a.paths, b.paths, `both rubrics use the same mark for ${d.id}`);
  }
});

test("24 dimension marks plus the two call-type marks, all distinct", () => {
  assert.equal(Object.keys(DIMENSION_ICONS).length, 26);
  assert.ok(DIMENSION_ICONS["call:kickoff"]);
  assert.ok(DIMENSION_ICONS["call:coaching"]);

  const seen = new Map<string, string>();
  for (const [key, icon] of Object.entries(DIMENSION_ICONS)) {
    const sig = icon.paths.join("|");
    assert.equal(seen.get(sig), undefined, `${key} duplicates ${seen.get(sig)}`);
    seen.set(sig, key);
  }
});

test("a rendered mark sets BOTH stroke and fill, or it renders invisible", () => {
  // SVG's default stroke is `none`. Every path in the set is an outline that relies on the
  // wrapper for both. Drop either declaration and all 26 marks silently vanish.
  const svg = iconSvg("coaching:D1");
  assert.match(svg, /stroke:currentColor/);
  assert.match(svg, /fill:none/);
  assert.equal((svg.match(/<path /g) ?? []).length, DIMENSION_ICONS["coaching:D1"]!.paths.length);
});

test("an unknown key renders nothing rather than an empty box", () => {
  assert.equal(iconSvg("coaching:D99"), "");
  assert.equal(iconSvg("D1"), ""); // the old un-prefixed key must not resolve
});

// ------------------------------------------------------------------- measuring

test("the form's panel measures what the scorer will actually score", () => {
  // coaching-01 canonicalises to 196 lines / 35,557 characters. The design's hardcoded panel
  // claimed 35,558 — one character out, because it counted the raw paste rather than the
  // canonical body. That one character is exactly why this runs the scorer's own code.
  const m = measure(read("coaching-01"), "coaching");
  assert.equal(m.ok, true);
  assert.equal(m.lines, 196);
  assert.equal(m.characters, 35_557);
  assert.equal(m.speakers.length, 2);
  assert.equal(m.markers.inaudible, 1);
  assert.equal(m.hasTimestamps, false);
});

test("the talk-share cap threshold follows the rubric, not a constant", () => {
  assert.equal(measure(read("coaching-01"), "coaching").threshold, 0.75);
  assert.equal(measure(read("kickoff-02"), "kickoff").threshold, 0.7);
});

test("kickoff-02 straddles its cap and the panel says so", () => {
  // 73.1% by word trips a >70% cap, but the same words occupy ~69.4-75.1% of the TIME across a
  // plausible speaking-rate ratio. The verdict flips on an assumption nobody stated, so the
  // panel reports the interval and the word `indeterminate` rather than picking a side.
  const m = measure(read("kickoff-02"), "kickoff");
  assert.equal(m.talkShareVerdict, "indeterminate");
  assert.ok(m.coachTimeShareLow < 0.7 && m.coachTimeShareHigh > 0.7,
    `interval ${m.coachTimeShareLow}-${m.coachTimeShareHigh} does not straddle 0.70`);
  assert.match(m.talkShareStatement, /indeterminate and NOT applied/);
});

test("an empty box measures to nothing, not to the last transcript", () => {
  const m = measure("   \n  ", "coaching");
  assert.equal(m.ok, false);
  assert.equal(m.problem, null); // empty is not an error, it is simply nothing yet
  assert.equal(m.lines, 0);
  assert.equal(m.coachWordShare, 0);
});

test("a paste that is not a transcript is refused with the same sentence the run gives", () => {
  const junk = measure("this is not a transcript", "coaching");
  assert.equal(junk.ok, false);
  assert.match(junk.problem!, /fewer than two speaking turns/);

  const solo = measure("[Coach]: hello there\n[Coach]: still me talking", "coaching");
  assert.equal(solo.ok, false);
  assert.match(solo.problem!, /Only one speaker/);
});

test("every fixture measures cleanly on its own rubric", () => {
  for (const [name, callType] of [
    ["coaching-01", "coaching"], ["coaching-02", "coaching"],
    ["kickoff-01", "kickoff"], ["kickoff-02", "kickoff"],
  ] as const) {
    const m = measure(read(name), callType);
    assert.equal(m.ok, true, `${name} did not measure`);
    assert.equal(m.unmatched, 0, `${name} has ${m.unmatched} unparsed lines`);
    assert.equal(m.speakers.length, 2, `${name} has ${m.speakers.length} speakers`);
    assert.equal(m.hasTimestamps, false, `${name} unexpectedly carries timestamps`);
    assert.ok(m.coachTimeShareLow <= m.coachWordShare && m.coachWordShare <= m.coachTimeShareHigh,
      `${name}: the word share must sit inside the time interval (it is the r=1 case)`);
  }
});
