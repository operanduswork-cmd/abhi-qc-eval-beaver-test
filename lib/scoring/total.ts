import { bandFor, type Band, type Cap, type CapDetermination, type Dimension } from "../rubric/types.ts";

/**
 * The arithmetic. All of it, in code — never asked of the model.
 *
 * The ORDER IS LOAD-BEARING and both rubrics state it: caps are checked "before scoring", and
 * you must "record which cap fired". A fired cap is part of the output, not a silent
 * adjustment to a number — Luke's reference build renders one as a red pill in the report.
 *
 *   1  per-dimension scores arrive from the fixed enums
 *   2  apply DIMENSION caps           clamp individual scores
 *   3  resolve the active set         D2 N/A and D4-disabled reweighting
 *   4  raw = sum(scores), denom = sum(active maxima)
 *   5  reported = round(raw / denom * 100)
 *   6  apply TOTAL caps in REPORTED space, lowest wins, clamp to [0, 100]
 *   7  band from reported
 *
 * Total caps are applied in reported space because the bands are defined on 0-100. The rubric
 * does not say this outright; it is the only reading under which a "max 75 total" cap and a
 * band table that starts AT RISK at 60-69 describe the same scale.
 */

export interface DimensionOutcome {
  id: string;
  /** null when disabled or not evidenced. */
  score: number | null;
  maxPoints: number;
  disabled: boolean;
  disabledReason?: string;
  notEvidenced: boolean;
}

export interface CapOutcome {
  id: string;
  determination: CapDetermination;
  scope: "dimension" | "total";
  target: string | null;
  clamp: number;
  nonRecoverable: boolean;
}

export interface TotalResult {
  dimensions: DimensionOutcome[];
  rawTotal: number;
  maxPossible: number;
  normalizedTotal: number;
  band: Band;
  appliedTotalCaps: string[];
  /** Every reweighting and every defect in the source document, stated. */
  arithmeticNotes: string[];
}

/** Step 2 — a dimension cap clamps that dimension's score, never the total. */
export function applyDimensionCaps(
  dims: DimensionOutcome[],
  caps: CapOutcome[],
): { dims: DimensionOutcome[]; notes: string[] } {
  const notes: string[] = [];
  const out = dims.map((d) => ({ ...d }));

  for (const cap of caps) {
    // Only a FIRED cap clamps. `indeterminate` is explicitly not applied — a penalty that
    // cannot be established is not applied, and the report says which branch was taken.
    if (cap.determination !== "fired" || cap.scope !== "dimension" || !cap.target) continue;
    const d = out.find((x) => x.id === cap.target);
    if (!d || d.disabled || d.score === null) continue;

    if (d.score > cap.clamp) {
      notes.push(
        `${cap.id} fired: ${d.id} clamped from ${d.score} to ${cap.clamp}` +
        (cap.nonRecoverable ? " (non-recoverable — no other evidence buys this back)" : ""),
      );
      d.score = cap.clamp;
    } else if (cap.nonRecoverable && cap.clamp === 0) {
      // floor-zero regardless of what else was found
      if (d.score !== 0) { notes.push(`${cap.id} fired: ${d.id} floored to 0 (non-recoverable)`); d.score = 0; }
    }
  }
  return { dims: out, notes };
}

/**
 * Step 3 — the active set, and the reweighting that the source document leaves unexecutable.
 *
 * Two optional-dimension rules exist and the rubric never reconciles them:
 *   - D4 disabled (no movement coaching)  -> "the call is scored out of 85, not 100"
 *   - D2 not applicable (no diagnostics)  -> "redistribute weight to D3 and D4"
 *
 * DECISION D-02. On coaching-02 BOTH fire, and the D2 rule then instructs us to redistribute
 * weight onto D4 — the dimension that is disabled. As written it cannot be executed.
 *
 * The rule implemented: redistribute D2's weight ONLY to promotion targets that are still
 * active. If D4 is out, D3 absorbs all of it.
 *
 *   neither fires        -> denominator 105
 *   D2 N/A only          -> D3 15->20, D4 15->20, denominator 105
 *   D4 disabled only     -> denominator 90
 *   BOTH (coaching-02)   -> D3 15->25, denominator 90
 *
 * Why this and not the alternative (split 5/5 and let D4's half evaporate, giving 85): that
 * would silently shrink the instrument by five points nobody can score, and it only appears
 * attractive because it matches the "85" the document prints — a figure already provably wrong,
 * since the eleven non-D4 dimensions sum to 90, not 85. Matching it would mean matching a bug.
 * Both facts are surfaced in `arithmeticNotes` rather than papered over.
 */
export const D2_PROMOTION_TARGETS = ["D3", "D4"] as const;

export function resolveActiveSet(
  dims: DimensionOutcome[],
  callType: "kickoff" | "coaching",
): { dims: DimensionOutcome[]; notes: string[] } {
  const out = dims.map((d) => ({ ...d }));
  const notes: string[] = [];
  if (callType !== "coaching") return { dims: out, notes };

  const d2 = out.find((d) => d.id === "D2");
  const d2NotApplicable = !!d2?.disabled;

  if (d2NotApplicable && d2) {
    const targets = D2_PROMOTION_TARGETS
      .map((id) => out.find((d) => d.id === id))
      .filter((d): d is DimensionOutcome => !!d && !d.disabled);

    if (targets.length === 0) {
      notes.push(
        `D2 is N/A but neither D3 nor D4 is active, so its ${d2.maxPoints} points cannot be ` +
        `redistributed. Scored on the remaining dimensions.`,
      );
    } else {
      const each = d2.maxPoints / targets.length;
      for (const t of targets) {
        const before = t.maxPoints;
        t.maxPoints += each;
        // Scale the SCORE by the same factor as the maximum.
        //
        // Promoting the ceiling alone would be a bug: the dimension's enum still only emits
        // its original bucket values (D3 is {15,10,5,0}), so a D3 raised to a max of 25 could
        // never exceed 15 and the promoted points would be structurally unreachable. A
        // flawless coaching-02 would then peak at 89 (STRONG) instead of 100 (ELITE) — a band
        // error on a named eval target.
        //
        // "Redistribute weight" means the dimension counts for MORE, not that the coach must
        // somehow score higher on it than its own scale allows. Proportion is preserved:
        // 15/15 -> 25/25, 10/15 -> 16.67/25.
        if (t.score !== null && before > 0) {
          t.score = round2(t.score * (t.maxPoints / before));
        }
      }
      notes.push(
        `D2 is N/A. Per the rubric ("redistribute weight to D3 and D4") its ${d2.maxPoints} ` +
        `points are promoted onto the still-active target${targets.length > 1 ? "s" : ""} ` +
        `${targets.map((t) => t.id).join(" and ")} (+${each} each), with each score scaled by the ` +
        `same factor so the added weight is actually reachable. ` +
        (targets.length === 1
          ? `The rubric names D3 and D4, but D4 is disabled on this call, so D3 absorbs the full ` +
            `weight. Redistributing only half and discarding the rest would shrink the instrument ` +
            `by points no one can score.`
          : ``),
      );
    }
  }

  const disabled = out.filter((d) => d.disabled);
  if (disabled.some((d) => d.id === "D4")) {
    notes.push(
      `D4 is disabled (no movement coaching occurred). The rubric states the call is then ` +
      `"scored out of 85", but its other eleven dimensions sum to 90 — the stated figure is ` +
      `arithmetically wrong. The denominator used is the true sum of active maxima.`,
    );
  }

  return { dims: out, notes };
}

/** Steps 4-7. */
export function computeTotal(
  dims: DimensionOutcome[],
  caps: CapOutcome[],
  callType: "kickoff" | "coaching",
): TotalResult {
  const notes: string[] = [];

  const capped = applyDimensionCaps(dims, caps);
  notes.push(...capped.notes);

  const active = resolveActiveSet(capped.dims, callType);
  notes.push(...active.notes);

  const scoring = active.dims.filter((d) => !d.disabled);
  const rawTotal = round2(scoring.reduce((a, d) => a + (d.score ?? 0), 0));
  const maxPossible = round2(scoring.reduce((a, d) => a + d.maxPoints, 0));

  let normalized = maxPossible === 0 ? 0 : Math.round((rawTotal / maxPossible) * 100);

  // Step 6 — total caps, in REPORTED space, lowest wins.
  const fired = caps.filter((c) => c.scope === "total" && c.determination === "fired");
  const applied: string[] = [];
  for (const c of fired) {
    if (normalized > c.clamp) {
      applied.push(c.id);
      notes.push(`${c.id} fired: total capped from ${normalized} to ${c.clamp}.`);
      normalized = c.clamp;
    } else {
      notes.push(`${c.id} fired but the total (${normalized}) already sits at or below its ceiling of ${c.clamp}.`);
    }
  }
  // Two total caps can fire at once (coaching has a 75 and a 70). The rubric does not say
  // whether they stack; they cannot, because each is a ceiling. Applying them in sequence
  // means the lowest wins, which is the only reading that keeps both statements true.
  normalized = Math.max(0, Math.min(100, normalized));

  const indeterminate = caps.filter((c) => c.determination === "indeterminate");
  for (const c of indeterminate) {
    notes.push(
      `${c.id} is INDETERMINATE — supporting and contradicting evidence both exist. It is NOT ` +
      `applied: a penalty that cannot be established is not applied. Scored on the branch where ` +
      `the cap does not fire.`,
    );
  }

  if (callType === "coaching" && maxPossible === 105) {
    notes.push(
      `The coaching rubric's twelve dimensions sum to 105 while the document states the total ` +
      `is 100. The result is reported on the 100 scale by normalising against the true sum of ` +
      `active maxima, which is the mechanism the document itself specifies for the D4 case.`,
    );
  }

  return {
    dimensions: active.dims,
    rawTotal,
    maxPossible,
    normalizedTotal: normalized,
    band: bandFor(normalized),
    appliedTotalCaps: applied,
    arithmeticNotes: notes,
  };
}

/**
 * "The one thing" — what the call WOULD have scored with the single highest-leverage fix.
 *
 * Re-run the whole total with that dimension at full marks. Note a fired dimension cap on the
 * same dimension may also lift, which can move the number by more than the raw score delta —
 * so this must re-run the pipeline rather than just adding the difference.
 */
export function projectWith(
  dims: DimensionOutcome[],
  caps: CapOutcome[],
  callType: "kickoff" | "coaching",
  dimensionId: string,
): TotalResult {
  const lifted = dims.map((d) =>
    d.id === dimensionId && !d.disabled ? { ...d, score: d.maxPoints, notEvidenced: false } : { ...d },
  );
  const capsWithout = caps.filter((c) => !(c.scope === "dimension" && c.target === dimensionId));
  return computeTotal(lifted, capsWithout, callType);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Absence -> score. The rule the brief states three times, made executable.

export interface RequirementOutcome {
  requirementId: string;
  /** Count of evidence items that actually verified against the transcript. */
  verifiedCount: number;
  /** Count of verified items that contradict the requirement. */
  counterCount: number;
  /** True only for a requirement the format genuinely cannot carry (D12 timing). */
  unscoreable?: boolean;
}

export type RequirementState = "present" | "not_evidenced" | "contradicted" | "unscoreable";

export function requirementState(r: RequirementOutcome): RequirementState {
  if (r.unscoreable) return "unscoreable";
  if (r.verifiedCount > 0 && r.counterCount > 0) return "contradicted";
  if (r.verifiedCount > 0) return "present";
  return "not_evidenced";
}

export interface ResolvedScore {
  score: number | null;
  notEvidenced: boolean;
  /** Report-ready sentence. This is the "the dimension says so" text. */
  statement: string | null;
}

/**
 * Turn the model's chosen bucket plus the verified requirement outcomes into a final score.
 *
 * Three outcomes, kept strictly apart:
 *
 *   - the dimension DECLINES to score  -> only D2 (diagnostics N/A) and D4 (no movement
 *     coaching), because those are the only two the rubric allows. score: null, weight moves.
 *   - a behaviour is ABSENT            -> still scores. Clamped to `defaultWhenAbsent` where
 *     the rubric names one (D8 -> 5, D5 -> 7), otherwise the model's bucket stands.
 *   - a requirement is UNSCOREABLE     -> excluded from the absence calculation entirely, and
 *     the report says the transcript cannot settle it.
 *
 * The narrowness is the point. If "not enough evidence" generally meant "no score", every cap
 * could be dodged — including D10's 0/5 non-recoverable, which is the exact failure coaching-01
 * exists to catch.
 *
 * On evidence failure we CLAMP to the default rather than flooring to 0. Flooring is harsher
 * than the source document: D8 is explicitly 5/5 when no struggle arose, because a smooth call
 * is not a failed one.
 */
export function resolveDimensionScore(
  dim: { id: string; maxPoints: number; defaultWhenAbsent: number | null; enum: number[] },
  modelScore: number | null,
  requirements: RequirementOutcome[],
  disabled?: { reason: string },
): ResolvedScore {
  if (disabled) {
    return { score: null, notEvidenced: false, statement: `Not scored - ${disabled.reason}` };
  }

  const states = requirements.map(requirementState);
  const scoreable = states.filter((s) => s !== "unscoreable");
  const evidenced = scoreable.filter((s) => s === "present" || s === "contradicted").length;
  const absent = scoreable.filter((s) => s === "not_evidenced").length;
  const contradicted = scoreable.filter((s) => s === "contradicted").length;
  const unscoreable = states.filter((s) => s === "unscoreable").length;

  const notes: string[] = [];
  if (unscoreable > 0) {
    notes.push(
      `${unscoreable} of this dimension's criteria cannot be settled from a transcript and were ` +
      `excluded from scoring rather than counted against the coach.`,
    );
  }

  // Nothing at all was evidenced.
  if (scoreable.length > 0 && evidenced === 0) {
    if (dim.defaultWhenAbsent !== null) {
      notes.push(
        `Not evidenced in the transcript: none of this dimension's required behaviours were ` +
        `found. The rubric names ${dim.defaultWhenAbsent}/${dim.maxPoints} as the default where ` +
        `absence is not a fault, so the score clamps there rather than flooring to 0.`,
      );
      return { score: dim.defaultWhenAbsent, notEvidenced: true, statement: notes.join(" ") };
    }
    notes.push(
      `Not evidenced in the transcript: none of this dimension's required behaviours were ` +
      `found. The rubric names no default here, so absence carries its full cost and the score ` +
      `sits at the bottom of the scale.`,
    );
    return { score: Math.min(...dim.enum), notEvidenced: true, statement: notes.join(" ") };
  }

  // Partly evidenced. The gap is named AND enforced.
  if (absent > 0) {
    notes.push(
      `${absent} of ${scoreable.length} required behaviours are not evidenced in the transcript.`,
    );
  }
  if (contradicted > 0) {
    notes.push(
      `${contradicted} required behaviour(s) have both supporting and contradicting evidence, so ` +
      `they cannot be treated as established.`,
    );
  }

  let score = modelScore === null ? dim.defaultWhenAbsent ?? Math.min(...dim.enum) : modelScore;

  /**
   * THE TOP-BUCKET GATE.
   *
   * A rubric's top bucket is CONJUNCTIVE — it lists everything an Elite call does, and the call
   * has to do all of it. `requirements` is that cell split into its individual behaviours, so if
   * any one of them is unevidenced or contradicted, the top bucket is by definition not met and
   * the top value is not available.
   *
   * Without this gate the decomposition actively backfires: showing the model only the top
   * bucket's requirements turns the question into "is this Elite?" rather than "which bucket is
   * this?", and it answers yes on partial evidence. The first full run scored coaching-01 -- a
   * deliberately warm call with a contradicted booking -- 100/100 with twelve of twelve
   * dimensions maxed, including a D10 that reported 2 of 5 requirements missing and still took
   * full marks.
   *
   * This is the rubric's own logic, enforced in code rather than requested in a prompt.
   */
  const top = Math.max(...dim.enum);
  const topBucketMet = absent === 0 && contradicted === 0;
  if (!topBucketMet && score === top) {
    const next = dim.enum.filter((v) => v < top).sort((a, b) => b - a)[0] ?? top;
    notes.push(
      `The top bucket requires every one of its criteria to hold, so ${top}/${dim.maxPoints} is ` +
      `not available here. Score reduced to ${next}/${dim.maxPoints}.`,
    );
    score = next;
  }

  return { score, notEvidenced: absent > 0, statement: notes.length ? notes.join(" ") : null };
}
