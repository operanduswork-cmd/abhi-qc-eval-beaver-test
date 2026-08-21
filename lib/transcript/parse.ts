/**
 * Parse the flat `[Speaker Name]: text` format the brief's pipeline emits once it has
 * flattened the recorder payload.
 *
 * All four fixtures parse 100% cleanly: zero non-matching non-blank lines, exactly two
 * speakers each. That regularity is what makes deterministic parsing safe here.
 *
 * WHAT THIS FORMAT ACTUALLY CARRIES — corrected against the fixtures, because the earlier
 * research asserted the opposite and was wrong on three counts:
 *
 *   - NO timestamps. Verified: zero turn timestamps across all four files. So D12's minute
 *     targets genuinely cannot be measured, and any pacing signal must be a documented
 *     words/turns proxy. This is the ONE unobservability claim that survives.
 *   - Non-verbal markers DO exist, 42 of them: [laughs] x20, [inaudible] x8, [pause] x3,
 *     and eleven movement markers ([exertion], [breathing], [stepping], [shuffling]).
 *   - Turns are NOT strictly alternating. Eight same-speaker continuations across three of
 *     the four fixtures.
 *   - Interruption IS observable, two ways: a turn ending in a mid-sentence em-dash cut-off,
 *     and explicit verbal acknowledgement (coaching-02 L243 "sorry go on, you were saying-"
 *     / L244 "No no, go on, I interrupted you-").
 *
 * So coaching D1's "Listens before responding - no interruption" is SCORABLE, and D4's
 * "client performed any live movement" has direct evidence rather than only narration.
 */

const TURN = /^\[([^\]]+)\]:[ ]?(.*)$/;

/** Non-verbal markers the recorder emits inline, e.g. "[exertion]", "[laughs]". */
const MARKER = /\[([a-z][^\]]*)\]/g;

/**
 * Markers that are direct evidence a client physically moved during the call. This is
 * coaching D4 detection criterion 1, and it is observable — the earlier research claimed
 * movement "leaves no trace in a transcript", which the fixtures disprove.
 */
const MOVEMENT_MARKERS = /^(exertion|breathing|stepping|shuffling)/;

export interface Line {
  /** 1-based index into the canonical body. This is what a citation resolves to. */
  lineId: number;
  /**
   * 1-based speaking-turn index. NOT the same as lineId: a speaker who takes two
   * consecutive lines is still one turn. coaching-02 does this six times (after canonical
   * lines 46, 119, 146, 225, 273, 299), so the two must be tracked separately or turn-based
   * arithmetic silently drifts.
   */
  turnId: number;
  speaker: string;
  text: string;
  /** Character offsets into the canonical body, for mapping a verified quote back to a span. */
  charStart: number;
  charEnd: number;
  /** Inline non-verbal markers on this line, lower-cased, brackets stripped. */
  markers: string[];
  /** True when this line has movement-bearing markers (coaching D4 detection criterion 1). */
  hasMovementMarker: boolean;
  /**
   * True when the line ends in a mid-sentence em-dash, i.e. the speaker was cut off. Together
   * with explicit acknowledgement this makes interruption observable.
   */
  cutOff: boolean;
}

export interface Parsed {
  lines: Line[];
  speakers: string[];
  /** Canonical line numbers that did not match the turn format. Should be empty. */
  unmatched: number[];
  /**
   * Canonical line numbers that CONTINUE the previous line's speaker (i.e. line N where
   * N and N-1 share a speaker). These are the points where lineId and turnId diverge.
   */
  sameSpeakerRuns: number[];
  turnCount: number;
  /** Lines carrying movement markers. Non-empty => coaching D4 must NOT be disabled. */
  movementLines: number[];
  /** Lines ending in a mid-sentence cut-off. Candidate interruption evidence. */
  cutOffLines: number[];
}

export function parse(body: string): Parsed {
  const raw = body === "" ? [] : body.split("\n");
  const lines: Line[] = [];
  const unmatched: number[] = [];
  const sameSpeakerRuns: number[] = [];
  const movementLines: number[] = [];
  const cutOffLines: number[] = [];
  const seen: string[] = [];

  let offset = 0;
  let turnId = 0;
  let previousSpeaker: string | null = null;

  raw.forEach((text, i) => {
    const lineId = i + 1;
    const charStart = offset;
    const charEnd = offset + text.length;
    offset = charEnd + 1; // +1 for the \n we split on

    if (text.trim() === "") return;

    const m = TURN.exec(text);
    if (!m) {
      unmatched.push(lineId);
      return;
    }

    const speaker = m[1]!.trim();
    const spoken = m[2]!;

    if (speaker === previousSpeaker) sameSpeakerRuns.push(lineId);
    else turnId += 1;
    previousSpeaker = speaker;

    const markers = [...spoken.matchAll(MARKER)].map((m) => m[1]!.toLowerCase().trim());
    const hasMovementMarker = markers.some((m) => MOVEMENT_MARKERS.test(m));
    const cutOff = /[—–-]\s*$/.test(spoken.trim()) && spoken.trim().length > 1;

    if (hasMovementMarker) movementLines.push(lineId);
    if (cutOff) cutOffLines.push(lineId);

    if (!seen.includes(speaker)) seen.push(speaker);
    lines.push({ lineId, turnId, speaker, text: spoken, charStart, charEnd, markers, hasMovementMarker, cutOff });
  });

  return { lines, speakers: seen, unmatched, sameSpeakerRuns, turnCount: turnId, movementLines, cutOffLines };
}

/**
 * Which speaker is the coach? The transcript carries names, never roles.
 *
 * The operator picks this at run time — Luke's own reference UI has a COACH field, which is
 * the strong hint that it is asked rather than inferred. This helper exists only to seed a
 * sensible default in the picker: the higher word count. Across all four fixtures the coach
 * is the majority speaker (63.5%-73.1%), but that is a convenience, NOT evidence, and it is
 * never used to override an operator's choice.
 */
export function likelyCoach(parsed: Parsed): string | null {
  const words = new Map<string, number>();
  for (const l of parsed.lines) {
    words.set(l.speaker, (words.get(l.speaker) ?? 0) + countWords(l.text));
  }
  const ranked = [...words.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? null;
}

export function countWords(text: string): number {
  const t = text.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
}
