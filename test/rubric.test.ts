import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { COACHING_PACK } from "../lib/rubric/coaching.ts";
import { KICKOFF_PACK } from "../lib/rubric/kickoff.ts";
import { enumGroups, callOrder, type RubricPack } from "../lib/rubric/types.ts";

const PACKS = [COACHING_PACK, KICKOFF_PACK];
const rubricSrc = (n: string) =>
  readFileSync(join(import.meta.dirname, "..", "fixtures", "rubrics", `${n}-call-rubric.md`), "utf8");

// ------------------------------------------------------------------- totals

test("kickoff maxima sum to exactly 100; coaching to 105", () => {
  const sum = (p: RubricPack) => p.dimensions.reduce((a, d) => a + d.maxPoints, 0);
  assert.equal(sum(KICKOFF_PACK), 100);
  // 105, not the 100 the document claims. Surfaced rather than silently reconciled.
  assert.equal(sum(COACHING_PACK), 105);
  assert.match(COACHING_PACK.arithmeticNotes.join(" "), /sum to 105 while the document states/);
});

test("each pack has all twelve dimensions, D1..D12, no gaps", () => {
  for (const p of PACKS) {
    assert.equal(p.dimensions.length, 12, p.callType);
    assert.deepEqual(
      p.dimensions.map((d) => d.id),
      Array.from({ length: 12 }, (_, i) => `D${i + 1}`),
      p.callType,
    );
  }
});

// --------------------------------------------------------------------- enums

test("EVERY dimension's stated maximum is reachable from its enum", () => {
  // The bug D-03a fixed. Under the original rule kickoff D5 topped out at 9 against a
  // maxPoints of 10, so a flawless call could never score 100 and the instrument's true
  // ceiling was 99. If a rubric says "out of 10", 10 must be attainable.
  for (const p of PACKS) {
    for (const d of p.dimensions) {
      assert.equal(Math.max(...d.enum), d.maxPoints,
        `${p.callType} ${d.id}: max ${d.maxPoints} but enum tops out at ${Math.max(...d.enum)}`);
    }
  }
});

test("kickoff D5 includes 10 — the specific D-03a case", () => {
  const d5 = KICKOFF_PACK.dimensions.find((d) => d.id === "D5")!;
  assert.deepEqual(d5.enum, [10, 9, 8, 6, 3, 1, 0]);
});

test("enums are descending, unique, and always contain 0", () => {
  for (const p of PACKS) {
    for (const d of p.dimensions) {
      assert.deepEqual(d.enum, [...d.enum].sort((a, b) => b - a), `${p.callType} ${d.id} not descending`);
      assert.equal(new Set(d.enum).size, d.enum.length, `${p.callType} ${d.id} has duplicates`);
      assert.ok(d.enum.includes(0), `${p.callType} ${d.id} cannot score 0`);
    }
  }
});

test("every enum value has a bucket carrying its criteria", () => {
  for (const p of PACKS) {
    for (const d of p.dimensions) {
      for (const v of d.enum) {
        const b = d.buckets.find((x) => x.value === v);
        assert.ok(b, `${p.callType} ${d.id} value ${v} has no bucket`);
        assert.ok(b!.criteria.length > 20, `${p.callType} ${d.id} value ${v} has empty criteria`);
      }
    }
  }
});

test("no dimension can emit a value the rubric never offers — 7 stays excluded on kickoff D1", () => {
  const d1 = KICKOFF_PACK.dimensions.find((d) => d.id === "D1")!;
  assert.ok(!d1.enum.includes(7), "7 appears only in the Calibration Anchors, not D1's tiebreaks");
  assert.deepEqual(d1.enum, [10, 9, 8, 6, 4, 1, 0]);
});

// -------------------------------------------------------------- cache groups

test("enum grouping matches what probe M2b measured", () => {
  // M2b: the enum invalidates the prompt cache, the schema name does not. Fewer distinct
  // enums means fewer cache misses per run.
  assert.equal(enumGroups(COACHING_PACK).length, 4, "coaching should collapse to 4 groups");
  assert.equal(enumGroups(KICKOFF_PACK).length, 7, "kickoff should collapse to 7 groups");

  const five = enumGroups(COACHING_PACK).find((g) => g.key === "5,3,0")!;
  assert.deepEqual(five.dimensionIds, ["D7", "D8", "D9", "D11", "D12"]);
});

test("call order groups same-enum dimensions together and puts D12 last", () => {
  for (const p of PACKS) {
    const order = callOrder(p);
    assert.equal(order.length, 12, p.callType);
    assert.equal(order.at(-1), "D12", `${p.callType}: D12 must score last — its signals are other dimensions' outcomes`);
    assert.equal(new Set(order).size, 12, p.callType);
  }
});

// ------------------------------------------------------------- requirements

test("every dimension decomposes into at least two atomic requirements", () => {
  for (const p of PACKS) {
    for (const d of p.dimensions) {
      assert.ok(d.requirements.length >= 2,
        `${p.callType} ${d.id} has only ${d.requirements.length} requirements`);
      for (const r of d.requirements) {
        assert.match(r.id, new RegExp(`^${d.id}\\.r\\d+$`));
        assert.ok(r.text.length > 12, `${r.id} is too short to be a behaviour`);
      }
    }
  }
});

test("requirements come from the top bucket and are verbatim substrings of its criteria", () => {
  for (const p of PACKS) {
    for (const d of p.dimensions) {
      const top = d.buckets[0]!;
      for (const r of d.requirements) {
        assert.equal(r.fromBucket, top.label, `${r.id} not from the top bucket`);
        assert.ok(top.criteria.includes(r.text),
          `${r.id} is not verbatim in its bucket criteria: ${r.text.slice(0, 60)}`);
      }
    }
  }
});

test("coaching D1 splits into its five distinct behaviours", () => {
  const d1 = COACHING_PACK.dimensions.find((d) => d.id === "D1")!;
  assert.equal(d1.requirements.length, 5);
  assert.match(d1.requirements[0]!.text, /body, wins, AND struggles/);
  assert.match(d1.requirements[1]!.text, /no interruption/);
  assert.match(d1.requirements[3]!.text, /call intention/);
});

// ---------------------------------------------------- the observability fix

test("exactly ONE thing is genuinely unscoreable across both packs", () => {
  // Earlier drafts also listed interruption, live movement and listening pauses. All three
  // were falsified by grepping the corpus. Only D12's minute targets survive, because there
  // are zero timestamps in any fixture.
  const all = PACKS.flatMap((p) => p.dimensions.filter((d) => d.unobservable.length).map((d) => `${p.callType}:${d.id}`));
  assert.deepEqual(all, ["coaching:D12"]);
  assert.match(COACHING_PACK.dimensions.find((d) => d.id === "D12")!.unobservable[0]!, /no timestamps/);
});

test("coaching D1's interruption clause is a scorable requirement, NOT unscoreable", () => {
  // The correction. Shipping this as "cannot be observed" would have been falsifiable by
  // anyone who searched the transcript for "I interrupted you".
  const d1 = COACHING_PACK.dimensions.find((d) => d.id === "D1")!;
  assert.deepEqual(d1.unobservable, []);
  assert.ok(d1.requirements.some((r) => /no interruption/.test(r.text)),
    "the interruption clause must be a requirement the scorer reports on");
});

// -------------------------------------------------------- verbatim fidelity

test("bucket criteria are verbatim substrings of the source rubric", () => {
  // The strongest fidelity check available: if a compiler paraphrased anything, it fails here.
  for (const [p, srcName] of [[COACHING_PACK, "coaching"], [KICKOFF_PACK, "kickoff"]] as const) {
    // Strip markdown bold: the compiler was instructed to remove ** markers, so the source
    // must be normalised the same way before comparing. Everything else must match exactly.
    const src = rubricSrc(srcName).replace(/\*\*/g, "").replace(/\s+/g, " ");
    for (const d of p.dimensions) {
      for (const b of d.buckets) {
        const needle = b.criteria.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
        assert.ok(src.includes(needle),
          `${p.callType} ${d.id} value ${b.value}: criteria not found verbatim in source — "${needle.slice(0, 70)}"`);
      }
    }
  }
});

// ------------------------------------------------------------------- caps

test("every cap targets a dimension that exists, and cap ids are unique", () => {
  for (const p of PACKS) {
    const ids = p.dimensions.map((d) => d.id);
    const seen = new Set<string>();
    for (const c of p.caps) {
      assert.ok(!seen.has(c.id), `duplicate cap id ${c.id}`);
      seen.add(c.id);
      if (c.scope === "dimension") {
        assert.ok(c.target && ids.includes(c.target), `${c.id} targets missing dimension ${c.target}`);
      } else {
        assert.equal(c.target, null, `${c.id} is a total cap and must not target a dimension`);
      }
    }
  }
});

test("every cap is phrased as an enumeration, never as a negative question", () => {
  // Correction #5. Asking "were there no follow-up questions?" invites a yes/no guess;
  // "list EVERY follow-up question" makes absence a spot-checkable empty array.
  for (const p of PACKS) {
    for (const c of p.caps.filter((x) => x.resolution === "enumerated")) {
      assert.match(c.enumerationPrompt, /List EVERY|list EVERY/,
        `${c.id} is not phrased as an enumeration`);
      assert.match(c.enumerationPrompt, /empty array/i, `${c.id} does not license an empty answer`);
    }
  }
});

test("the two non-recoverable coaching caps are the ones the rubric names", () => {
  const nr = COACHING_PACK.caps.filter((c) => c.nonRecoverable).map((c) => c.target);
  assert.deepEqual(nr.sort(), ["D10", "D8"]);
});

test("talk-share caps are arithmetic and carry their thresholds", () => {
  const coaching = COACHING_PACK.caps.find((c) => c.id === "coaching-cap-talkshare")!;
  const kickoff = KICKOFF_PACK.caps.find((c) => c.id === "kickoff-cap-talkshare")!;
  assert.equal(coaching.resolution, "arithmetic");
  assert.equal(coaching.threshold, 0.75);
  assert.equal(kickoff.resolution, "arithmetic");
  assert.equal(kickoff.threshold, 0.70);
});

// --------------------------------------------------------------- defaults

test("defaults exist only where the rubric states one — missing is not zero", () => {
  const d = (id: string) => COACHING_PACK.dimensions.find((x) => x.id === id)!;
  assert.equal(d("D8").defaultWhenAbsent, 5, "no struggle present is not a fault");
  assert.equal(d("D5").defaultWhenAbsent, 7, "no adjustments needed is not a fault");
  // and nowhere else in coaching
  const withDefaults = COACHING_PACK.dimensions.filter((x) => x.defaultWhenAbsent !== null).map((x) => x.id);
  assert.deepEqual(withDefaults.sort(), ["D5", "D8"]);
});

// ------------------------------------------- the two dimensions allowed not to score

test("exactly TWO dimensions may decline to score, and they are D2 and D4", () => {
  // Deliberately narrow. A general "insufficient data -> no score" rule would let a coach
  // dodge every cap, including D10's 0/5 non-recoverable, which is the precise failure
  // coaching-01 was built to catch. Every other dimension scores absence.
  const optional = PACKS.flatMap((p) =>
    p.dimensions.filter((d) => d.optional).map((d) => `${p.callType}:${d.id}`));
  assert.deepEqual(optional.sort(), ["coaching:D2", "coaching:D4"]);
});

test("D4 carries exactly the FOUR numbered detection criteria, not the prose five", () => {
  // The bug: `optional` was omitted from the compiler's output schema, so nothing could decide
  // D4 was disabled and the coaching-02 target silently broke.
  const d4 = COACHING_PACK.dimensions.find((d) => d.id === "D4")!;
  assert.ok(d4.optional, "D4 must carry its disable rules");
  assert.equal(d4.optional!.detectionCriteria.length, 4);
  assert.match(d4.optional!.detectionCriteria[0]!, /Client performed any live movement/);
  assert.equal(d4.optional!.disabledBand, "N/A");
  // the prose adds a fifth exclusion; the numbered list is normative and the gap is surfaced
  assert.match(COACHING_PACK.arithmeticNotes.join(" "), /FIVE exclusions in prose but only FOUR/);
});

test("D2 redistributes to D3 and D4; D4 redistributes to nothing", () => {
  const d2 = COACHING_PACK.dimensions.find((d) => d.id === "D2")!;
  const d4 = COACHING_PACK.dimensions.find((d) => d.id === "D4")!;
  assert.deepEqual(d2.optional!.redistributeTo, ["D3", "D4"]);
  assert.deepEqual(d4.optional!.redistributeTo, [], "D4's weight leaves the denominator entirely");
});

test("no kickoff dimension may decline to score", () => {
  // Kickoff sums to exactly 100 with all twelve active. Nothing opts out.
  for (const d of KICKOFF_PACK.dimensions) {
    assert.equal(d.optional, undefined, `kickoff ${d.id} should not be optional`);
  }
});

test("D4's detection criteria are all observable from the transcript", () => {
  // They were briefly believed unobservable. coaching-01 carries eleven inline movement
  // markers at L48-L86, which is direct evidence for criterion 1.
  const d4 = COACHING_PACK.dimensions.find((d) => d.id === "D4")!;
  assert.deepEqual(d4.unobservable, [], "D4 has nothing unscoreable");
});

// --------------------------------------------------- cap enumeration polarity

test("every cap declares which side its enumeration lists", () => {
  // This was implicit once and two caps silently resolved backwards: coaching-cap-struggle
  // reported `indeterminate` on a call where D8 scored 5/5 and the struggle was plainly
  // handled. HANDOFF-BACKEND.md §8 caught it from the outside.
  for (const p of PACKS) {
    for (const c of p.caps) {
      assert.ok(c.enumerates === "absence_case" || c.enumerates === "firing_case",
        `${c.id} has no declared polarity`);
    }
  }
});

test("exactly the two CONDITIONAL caps enumerate their firing case", () => {
  // "struggle present AND ignored" and "confusion present AND unresolved" are conditional,
  // not plain absences — enumerating the raw struggles or the raw confusion makes a
  // well-handled call look self-contradictory.
  const firing = PACKS.flatMap((p) => p.caps.filter((c) => c.enumerates === "firing_case").map((c) => c.id));
  assert.deepEqual(firing.sort(), ["coaching-cap-struggle", "kickoff-cap-confusion"]);
});

test("firing-case prompts tell the model NOT to list the handled case", () => {
  for (const p of PACKS) {
    for (const c of p.caps.filter((x) => x.enumerates === "firing_case")) {
      assert.match(c.enumerationPrompt, /Do NOT list/,
        `${c.id} must exclude the handled case or it inverts again`);
      assert.match(c.enumerationPrompt, /empty array/i);
    }
  }
});

test("absence-case prompts never ask for the firing case", () => {
  for (const p of PACKS) {
    for (const c of p.caps.filter((x) => x.enumerates === "absence_case" && x.resolution === "enumerated")) {
      assert.match(c.enumerationPrompt, /List EVERY/, c.id);
      assert.ok(!/Do NOT list a struggle|left UNRESOLVED/.test(c.enumerationPrompt), c.id);
    }
  }
});
