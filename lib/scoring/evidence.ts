import type { Parsed } from "../transcript/parse.ts";

/**
 * Quote verification. The single most important correction in the whole build.
 *
 * The obvious design is to check the quote against the line the model cited. That design is
 * BACKWARDS. Models get prepended line numbers wrong routinely, and under it one off-by-one
 * turns a behaviour that genuinely occurred into unverified evidence, which floors a dimension
 * that was actually fine. That is a false negative in the direction that looks like diligence —
 * the hardest kind to catch in your own demo, because the system appears rigorous while being
 * wrong.
 *
 * So: THE QUOTE IS THE KEY, THE LINE NUMBER IS ONLY A HINT. Search the normalised quote across
 * the WHOLE transcript, map the match back to the original span, and derive the line number in
 * code. The model's number is compared afterwards, and a mismatch is a warning, not a rejection.
 */

export type EvidenceStatus =
  /** Found, and the model's line number was right. */
  | "verified"
  /** Found elsewhere. Accept the evidence, correct the line, warn. */
  | "verified_location_mismatch"
  /** Not present in the transcript at all. This is the only status that retries. */
  | "not_found"
  /** Present, but too short to be uniquely identifying. */
  | "too_short";

export interface RawEvidence {
  quote: string;
  line?: number;
  speaker?: string;
}

export interface VerifiedEvidence {
  quote: string;
  /** Verbatim text from the transcript at the matched span — NOT the model's rendering. */
  exact: string;
  status: EvidenceStatus;
  /** Derived in code from the match position. Authoritative. */
  line: number | null;
  /** What the model claimed, kept for the audit trail. */
  claimedLine: number | null;
  speaker: string | null;
  charStart: number | null;
  charEnd: number | null;
  wordCount: number;
}

/**
 * Minimum quote length, in words.
 *
 * Measured across these transcripts: 8-word quotes are 99.7-100% unique within a transcript,
 * 3-word quotes only 87-94%. Below 8 words a "verified" quote may be verifying the wrong
 * occurrence, which is worse than not verifying at all because it carries false confidence.
 */
export const MIN_QUOTE_WORDS = 8;

/**
 * Normalise for comparison only. Every transformation here must be length-tracked so a match
 * position can be mapped back to the original string — that is what `map` is for.
 *
 * Handles the differences that are cosmetic rather than substantive: smart quotes vs straight,
 * dash variants, non-breaking spaces, whitespace runs, and case. It does NOT do fuzzy or
 * edit-distance matching: that was rejected because its motivation is PDF-extraction noise we
 * do not have, and its cost is accepting a fabricated-but-on-topic quote as real.
 */
interface Normalised {
  text: string;
  /** map[i] = index into the original string of normalised character i. */
  map: number[];
}

function normalise(input: string): Normalised {
  const out: string[] = [];
  const map: number[] = [];
  let lastWasSpace = true; // suppress leading whitespace

  for (let i = 0; i < input.length; i++) {
    let ch = input[i]!;

    if (ch === "‘" || ch === "’" || ch === "ʼ" || ch === "´") ch = "'";
    else if (ch === "“" || ch === "”") ch = '"';
    else if (ch === "–" || ch === "—" || ch === "‒" || ch === "−") ch = "-";
    else if (ch === "…") ch = ".";

    if (/\s/.test(ch)) {
      if (lastWasSpace) continue;
      out.push(" ");
      map.push(i);
      lastWasSpace = true;
      continue;
    }

    out.push(ch.toLowerCase());
    map.push(i);
    lastWasSpace = false;
  }

  while (out.length && out[out.length - 1] === " ") { out.pop(); map.pop(); }
  return { text: out.join(""), map };
}

export function countQuoteWords(quote: string): number {
  const t = quote.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
}

export interface Verifier {
  verify(ev: RawEvidence): VerifiedEvidence;
  verifyAll(evs: RawEvidence[]): VerifiedEvidence[];
}

/**
 * Build a verifier bound to one canonical transcript body. Normalising the body once and
 * reusing it matters: a 65k-character transcript verified against 12 dimensions' worth of
 * evidence would otherwise re-normalise dozens of times.
 */
export function createVerifier(body: string, parsed: Parsed): Verifier {
  const hay = normalise(body);

  const lineAt = (charIndex: number) => {
    // lines are ordered; a linear scan is fine at this size and avoids an index structure
    for (const l of parsed.lines) {
      if (charIndex >= l.charStart && charIndex <= l.charEnd) return l;
    }
    return null;
  };

  function verify(ev: RawEvidence): VerifiedEvidence {
    const claimedLine = ev.line ?? null;
    const wordCount = countQuoteWords(ev.quote);
    const miss = (status: EvidenceStatus): VerifiedEvidence => ({
      quote: ev.quote, exact: "", status, line: null, claimedLine,
      speaker: ev.speaker ?? null, charStart: null, charEnd: null, wordCount,
    });

    if (wordCount < MIN_QUOTE_WORDS) return miss("too_short");

    const needle = normalise(ev.quote);
    if (needle.text === "") return miss("not_found");

    const at = hay.text.indexOf(needle.text);
    if (at === -1) return miss("not_found");

    const charStart = hay.map[at]!;
    const charEnd = (hay.map[at + needle.text.length - 1] ?? charStart) + 1;
    const line = lineAt(charStart);

    // The model's number is a hint. Ours is derived. A disagreement is recorded, not fatal.
    const status: EvidenceStatus =
      claimedLine === null || line === null || claimedLine === line.lineId
        ? "verified"
        : "verified_location_mismatch";

    return {
      quote: ev.quote,
      exact: body.slice(charStart, charEnd),
      status,
      line: line?.lineId ?? null,
      claimedLine,
      speaker: line?.speaker ?? ev.speaker ?? null,
      charStart,
      charEnd,
      wordCount,
    };
  }

  return { verify, verifyAll: (evs) => evs.map(verify) };
}

/** Only `not_found` is worth another model call. A short quote needs a different instruction. */
export function needsRetry(evs: VerifiedEvidence[]): boolean {
  return evs.some((e) => e.status === "not_found");
}

/** Evidence that actually counts toward a cap or a score. */
export function usable(evs: VerifiedEvidence[]): VerifiedEvidence[] {
  return evs.filter((e) => e.status === "verified" || e.status === "verified_location_mismatch");
}
