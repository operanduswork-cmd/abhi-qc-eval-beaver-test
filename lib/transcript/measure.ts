import { prepare } from "./canonicalise.ts";
import { parse, likelyCoach } from "./parse.ts";
import { talkShare, resolveThreshold } from "./talkshare.ts";
import { COACHING_CAPS, KICKOFF_CAPS } from "../rubric/caps.ts";

/**
 * Everything the run form can state about a pasted transcript BEFORE any model is called.
 *
 * Every field here is arithmetic on the canonical body, so the panel shows the numbers the run
 * will actually be scored on — not an approximation of them. Nothing in this file guesses: a
 * transcript that does not parse reports `ok: false` and says which lines failed, rather than
 * silently reporting the counts of the lines that happened to match.
 */
export interface Measurement {
  /** False when the paste is not a usable transcript. `problem` says why, in a sentence. */
  ok: boolean;
  problem: string | null;

  lines: number;
  characters: number;
  speakers: string[];
  /** The higher word count. A default for the picker, never evidence — see likelyCoach. */
  coach: string | null;

  /** Point estimate. The r = 1.0 case. */
  coachWordShare: number;
  /** The interval the cap is actually resolved against. The rubric phrases it in TIME. */
  coachTimeShareLow: number;
  coachTimeShareHigh: number;
  rateRatioRange: { min: number; max: number };

  /** The talk-share cap for THIS rubric: 0.75 coaching, 0.70 kick-off. */
  threshold: number;
  /** fired | not_fired | indeterminate — the same three states the report uses. */
  talkShareVerdict: "fired" | "not_fired" | "indeterminate";
  /** One sentence, publishable as-is. Identical wording to the report and the PDF. */
  talkShareStatement: string;

  /** Inline non-verbal markers, counted by kind: {laughs: 20, inaudible: 8, ...}. */
  markers: Record<string, number>;
  /** Turns cut off mid-sentence — candidate interruption evidence. */
  cutOffs: number;
  /** Lines that did not match `[Speaker]: text`. */
  unmatched: number;
  /** The fixtures carry none; D12's minute targets are unmeasurable without them. */
  hasTimestamps: boolean;
}

/** A leading clock, e.g. "00:14:32" or "[14:32]", before the speaker label. */
const TIMESTAMP = /^\s*[[(]?\d{1,2}:\d{2}(:\d{2})?[\])]?/;

const EMPTY = (problem: string | null): Measurement => ({
  ok: false, problem,
  lines: 0, characters: 0, speakers: [], coach: null,
  coachWordShare: 0, coachTimeShareLow: 0, coachTimeShareHigh: 0,
  rateRatioRange: { min: 0.9, max: 1.2 },
  threshold: 0.75, talkShareVerdict: "not_fired", talkShareStatement: "",
  markers: {}, cutOffs: 0, unmatched: 0, hasTimestamps: false,
});

export function measure(input: string, callType: "kickoff" | "coaching"): Measurement {
  if (!input.trim()) return EMPTY(null); // empty box is not an error, just nothing yet

  const canonical = prepare(input);
  const parsed = parse(canonical.body);
  const coach = likelyCoach(parsed);

  const caps = callType === "coaching" ? COACHING_CAPS : KICKOFF_CAPS;
  const threshold = caps.find((c) => c.resolution === "arithmetic")?.threshold ?? 0.75;

  const base = {
    lines: canonical.lineCount,
    characters: canonical.body.length,
    speakers: parsed.speakers,
    coach,
    markers: parsed.lines.reduce<Record<string, number>>((acc, l) => {
      for (const m of l.markers) acc[m] = (acc[m] ?? 0) + 1;
      return acc;
    }, {}),
    cutOffs: parsed.cutOffLines.length,
    unmatched: parsed.unmatched.length,
    hasTimestamps: canonical.body.split("\n").some((l) => TIMESTAMP.test(l)),
    rateRatioRange: { min: 0.9, max: 1.2 },
    threshold,
  };

  // The same two refusals POST /api/runs applies, so the panel never says "ready" about a paste
  // the run would reject. Stated here rather than left to the button, which is where an operator
  // finds out about it far too late.
  if (canonical.lineCount < 2) {
    return { ...EMPTY("That does not look like a transcript — it has fewer than two speaking turns."), ...base, ok: false };
  }
  if (parsed.speakers.length < 2 || !coach) {
    return {
      ...EMPTY(
        `Only one speaker was found. Transcripts must use the format "[Speaker Name]: what they said", ` +
        `one turn per line.` +
        (parsed.unmatched.length ? ` ${parsed.unmatched.length} line(s) did not match that format.` : ""),
      ),
      ...base, ok: false,
    };
  }

  const ts = talkShare(parsed, coach);
  const verdict = resolveThreshold(ts, threshold);

  return {
    ...base,
    ok: true,
    problem: null,
    coachWordShare: ts.coachWordShare,
    coachTimeShareLow: ts.coachTimeShareLow,
    coachTimeShareHigh: ts.coachTimeShareHigh,
    talkShareVerdict: verdict.verdict,
    talkShareStatement: verdict.statement,
  };
}
