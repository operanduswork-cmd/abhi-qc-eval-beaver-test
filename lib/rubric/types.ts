/**
 * The compiled rubric pack.
 *
 * Both rubrics are grading documents written for humans. Nobody has adapted them into
 * instructions for a model. This type is the target of that adaptation: everything the
 * scorer needs, with every judgement call made once, at compile time, and written down —
 * rather than re-made by the model on every run.
 *
 * A pack is stored under its own content hash, so a run from last week still resolves to the
 * exact pack that scored it.
 */

/**
 * Coaching scores are discrete buckets ("must be exactly one of the bucket values listed. No
 * interpolation"). Kick-off is a HYBRID: 7 of 12 dimensions are buckets, 5 are bands giving a
 * range. `range` dimensions are the reproducibility problem — "any integer in 6-8" gives a
 * model three legal answers and no tiebreak. Compilation collapses them to a fixed enum.
 */
export type ScoringMode = "bucket" | "range";

export interface Bucket {
  value: number;
  /** "Elite" | "Strong" | "Mid" | "Weak" | "Fail", verbatim from the rubric. */
  label: string;
  /** The criteria cell, verbatim. Never paraphrased — the model reads the rubric's own words. */
  criteria: string;
  /** For `range` dimensions: the band this collapsed value came from, e.g. "6-8". */
  sourceBand?: string;
}

/**
 * Everything the model is shown about one dimension, plus everything code needs to score it.
 */
export interface Dimension {
  id: string;                    // "D1".."D12"
  title: string;
  maxPoints: number;
  pillar?: string;
  scoringMode: ScoringMode;

  /**
   * The ONLY values the model may emit, enforced at decode time via a numeric JSON-Schema
   * enum plus additionalProperties:false. M3 proved this is a hard constraint, not a hint:
   * 20 adversarial attempts to force an excluded value produced zero.
   *
   * Dimensions sharing an identical enum share a schema and therefore share a prompt cache
   * (M2b: the enum invalidates the cache, the schema name does not). Order the calls by
   * enum group.
   */
  enum: number[];

  buckets: Bucket[];

  /**
   * The top bucket's criteria, split into atomic behaviours. The scorer reports evidence per
   * requirement, and code derives `not_evidenced` from an empty array — which is what makes
   * "the dimension says so" structural rather than a hope about the reasoning prose.
   */
  requirements: Requirement[];

  /** What to look for, verbatim. */
  whatToLookFor: string;

  /**
   * Verbatim tiebreak sentences from the rubric, e.g. "Score 8 when the gap is minor and
   * clearly outweighed by solid prep; 6 when prep is real but uneven." For `range`
   * dimensions these are what justify the collapsed enum values — see compile-notes.md.
   */
  tiebreaks: string[];

  positiveSignals: string[];
  negativeSignals: string[];
  /** Calibration notes and reviewer-aligned anchors that apply to this dimension. */
  calibrationNotes: string[];
  /** Prompts/phrases the rubric says to listen for. */
  listenFor: string[];

  /**
   * Criteria this transcript format CANNOT support, with the reason. The report states these
   * rather than inferring them. Example: coaching D1's "Listens before responding - no
   * interruption" is unobservable when there are no overlap markers, no timestamps, and
   * strictly alternating turns.
   */
  unobservable: string[];

  /**
   * Score to use when the behaviour is genuinely absent AND absence is not a fault, e.g.
   * D8 -> 5/5 when no struggle arose, D5 -> 7/10 when no adjustments were needed.
   * On evidence failure we CLAMP to this, never floor to 0 — missing is not zero, and
   * flooring is harsher than the source document.
   */
  defaultWhenAbsent: number | null;

  /**
   * Set on the only two dimensions the rubric allows to not score at all: coaching D2 (N/A when
   * diagnostics do not apply) and coaching D4 (disabled when no movement coaching occurred).
   *
   * This is deliberately NOT a general "insufficient data" escape. Every other dimension scores
   * absence — usually 0 via its Fail bucket, or `defaultWhenAbsent` where the rubric names one.
   * Generalising it would let a coach dodge every cap, including D10's 0/5 non-recoverable,
   * which is exactly what coaching-01 was built to catch.
   */
  optional?: {
    /** The condition, verbatim from the rubric. */
    disableWhen: string;
    /**
     * D4: ALL of these must be absent to disable. The rubric's prose lists FIVE exclusions
     * (it adds "no in-call demonstration") while its own numbered list has FOUR. The four
     * numbered criteria are normative; see compile-notes.md.
     *
     * Note these ARE observable: coaching-01 carries eleven inline movement markers
     * ([exertion], [stepping], [breathing]) at L48-L86. parse.ts exposes `movementLines`.
     */
    detectionCriteria: string[];
    disabledBand: string;
    /** Dimension ids this dimension's weight moves to when it does not score. */
    redistributeTo: string[];
  };

  /** Cap ids that can clamp this dimension. */
  cappedBy: string[];
}

export type CapScope = "dimension" | "total";

/**
 * A cap, compiled as an ENUMERATION rather than a negative.
 *
 * Never "were there no follow-up questions?" — that invites a yes/no guess. Always "list
 * EVERY follow-up question, with verbatim evidence; empty array if none", after which code
 * computes `absent := verified.length === 0`. Absence becomes a spot-checkable enumeration
 * instead of an assertion. M5 measured this working 10/10 on the adversarial case.
 */
export interface Cap {
  id: string;
  /** The condition exactly as the rubric words it. */
  condition: string;
  scope: CapScope;
  /** Dimension id for scope "dimension"; null for a total cap. */
  target: string | null;
  /** Clamp ceiling: the score/total may not exceed this once the cap fires. */
  clamp: number;
  /**
   * "non-recoverable" in the rubric's language: floor-zero, no other evidence buys it back.
   * Coaching D10 and D8 are the two.
   */
  nonRecoverable: boolean;
  /**
   * The enumeration put to the model. Resolved once in the fact pass, then injected into the
   * dimension calls as a GIVEN PREMISE — twelve calls each voting on one global fact would
   * disagree, and the tiebreak would be arbitrary.
   */
  enumerationPrompt: string;
  /**
   * `arithmetic` caps are resolved in code with no model involvement at all (talk-share).
   * `enumerated` caps are resolved from verified model evidence.
   */
  resolution: "enumerated" | "arithmetic";
  /**
   * WHICH SIDE the enumeration lists — and therefore what an empty array means.
   *
   * Most caps enumerate the case where the condition does NOT hold ("list every follow-up
   * question"), so an empty result means the cap FIRES. Two enumerate the firing case directly,
   * because their condition is conditional rather than a plain absence: "struggle present AND
   * ignored", "confusion present AND unresolved". Listing the raw struggles there made a
   * well-handled call look self-contradictory.
   *
   * This must be explicit. It was implicit once, and two caps silently resolved backwards.
   */
  enumerates: "absence_case" | "firing_case";
  /** For arithmetic caps: the share threshold, e.g. 0.70. */
  threshold?: number;
}

export type CapDetermination = "fired" | "not_fired" | "indeterminate";

export interface Band {
  name: "ELITE" | "STRONG" | "INCONSISTENT" | "AT RISK" | "FAIL";
  min: number;
  max: number;
}

/** Identical across both rubrics. Use their names, not ours. */
export const BANDS: Band[] = [
  { name: "ELITE", min: 90, max: 100 },
  { name: "STRONG", min: 80, max: 89 },
  { name: "INCONSISTENT", min: 70, max: 79 },
  { name: "AT RISK", min: 60, max: 69 },
  { name: "FAIL", min: 0, max: 59 },
];

export function bandFor(reported: number): Band {
  return BANDS.find((b) => reported >= b.min && reported <= b.max) ?? BANDS[BANDS.length - 1]!;
}


/**
 * D-04 — the four states a required behaviour can be in, and the four different things the
 * report must say. The brief states this three times: "When a behaviour is not in the
 * transcript, the dimension says so. It does not guess and it does not read the mood of the
 * call."
 *
 * "Says so" is an OUTPUT requirement, not a scoring one. A dimension returning 3/10 with prose
 * has not complied — it must NAME the missing behaviour. That is only structurally possible if
 * every requirement has its own evidence slot, which is why `Dimension.requirements` exists and
 * why presence is derived in code from an empty array rather than asserted by the model.
 *
 * Conflating `not_evidenced` with `unscoreable` costs real points in both directions. Saying
 * "cannot analyse" about a coach who simply did not book the next call hands them a free pass
 * on a 0/5 non-recoverable — the exact failure coaching-01 exists to catch. Saying "did not
 * happen" about D12's pacing penalises the coach for our instrument's blindness.
 */
export type EvidenceState =
  /** Verified evidence found. */
  | "present"
  /**
   * We looked and found nothing. Scored as absent. Reported as "not evidenced in the
   * transcript" — NOT "did not happen", because the transcript is all we ever see and the
   * coach may have done it off-recording.
   */
  | "not_evidenced"
  /** Supporting and contradicting evidence both exist. Quote BOTH, name the branch scored. */
  | "contradicted"
  /**
   * The format genuinely cannot carry this signal, so no transcript could ever settle it.
   * Reported as "cannot analyse - the transcript does not cover this".
   *
   * After the observability correction of 21 Aug this set has ONE member: D12's minute targets,
   * because there are zero timestamps in any of the four fixtures. Interruption, live movement
   * and pauses all turned out to be observable via inline markers and em-dash cut-offs. Do not
   * grow this set without grepping the corpus first.
   */
  | "unscoreable";

/**
 * One atomic behaviour the top bucket requires, split out of that bucket's criteria text so the
 * model reports on each separately. Fixed at compile time rather than decided per run — a fixed
 * requirement list means the same structure every time, which is half of reproducibility.
 */
export interface Requirement {
  /** Stable within the dimension, e.g. "D1.r3". Used as the schema key. */
  id: string;
  /** Verbatim sentence from the bucket's criteria cell. */
  text: string;
  /** Which bucket this requirement was taken from, e.g. "Elite". */
  fromBucket: string;
  /** Set only for the rare genuinely-unscoreable requirement, with the reason. */
  unscoreableReason?: string;
}

/** What the scorer produces per requirement. `state` is derived in code, never asked for. */
export interface RequirementFinding {
  requirementId: string;
  evidence: unknown[];
  counterEvidence: unknown[];
  state: EvidenceState;
}

export type CallType = "kickoff" | "coaching";

export interface RubricPack {
  callType: CallType;
  dimensions: Dimension[];
  caps: Cap[];
  scoringPrinciples: string[];
  /**
   * Where the source document contradicts itself or its own arithmetic. Surfaced on the
   * report rather than papered over — e.g. the coaching dimensions sum to 105 while the
   * document states 100, and its stated 85-with-D4-disabled is wrong because the other
   * eleven sum to 90.
   */
  arithmeticNotes: string[];
}

/** Distinct enums, in call order, so same-enum dimensions run consecutively and share cache. */
export function enumGroups(pack: RubricPack): { key: string; enum: number[]; dimensionIds: string[] }[] {
  const groups = new Map<string, { key: string; enum: number[]; dimensionIds: string[] }>();
  for (const d of pack.dimensions) {
    const key = d.enum.join(",");
    const g = groups.get(key);
    if (g) g.dimensionIds.push(d.id);
    else groups.set(key, { key, enum: d.enum, dimensionIds: [d.id] });
  }
  return [...groups.values()];
}

/** Call order: grouped by enum (cache), with D12 forced last (its signals are other outcomes). */
export function callOrder(pack: RubricPack): string[] {
  const ordered = enumGroups(pack).flatMap((g) => g.dimensionIds).filter((id) => id !== "D12");
  return [...ordered, "D12"];
}
