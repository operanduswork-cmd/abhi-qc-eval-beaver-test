/**
 * THE RENDER CONTRACT — what the report page consumes.
 *
 * The frontend renders this and nothing else. It holds no scores, no quotes and no line
 * numbers of its own; `scripts/render-report.mjs` builds the report section from a file
 * shaped like this, so replacing the file replaces the report.
 *
 * `eval/out/coaching-01.json` already satisfies most of it. The three fields marked
 * ** NOT YET PRODUCED ** are the gap: the brief names six things the report must contain,
 * and the scorer currently emits three of them.
 */

import type { Band } from "../rubric/types";

export interface EvidenceRow {
  /** Verbatim span from the transcript. >=8 words — 8-word spans are 99.7-100% unique. */
  quote: string;
  /** The original span as it appears in the source, before normalisation. Rendered, not `quote`. */
  exact: string;
  /** "verified" renders normally; anything else renders as a dashed, uncoloured row. */
  status: "verified" | "not_found" | "too_short" | "ambiguous";
  /** DERIVED IN CODE from where the quote was found. Never taken from the model. */
  line: number;
  /** What the model claimed. Kept only so the two can be compared; never rendered. */
  claimedLine: number;
  /** DERIVED from the `[Name]:` prefix of `line`. Never taken from the model. */
  speaker: string;
  charStart: number;
  charEnd: number;
  wordCount: number;
}

export interface DimensionReport {
  id: string;                       // "D1".."D12" — also the icon key, see ./icons.ts
  title: string;
  score: number | null;             // null only when `disabled`
  maxPoints: number;
  bucketMatched: string | null;     // "Elite" | "Strong" | "Mid" | "Fail", the rubric's word
  disabled: boolean;                // D2 and D4 only
  disabledReason: string | null;
  /** True when a required behaviour was looked for and not found. Drives "the dimension says so". */
  notEvidenced: boolean;
  /** The sentence that states the absence. Rendered verbatim — never paraphrased into prose. */
  absenceStatement: string | null;
  reasoning: string;
  quickFix: string;
  evidence: EvidenceRow[];
}

export interface CapReport {
  id: string;
  /** Three states, not two. A boolean cannot describe coaching-01. */
  determination: "fired" | "not_fired" | "indeterminate";
  scope: "dimension" | "total";
  target: string | null;
  clamp: number;
  nonRecoverable: boolean;
  /** Quotes BOTH sides when indeterminate, and names the branch scored. */
  statement: string;
}

export interface TotalReport {
  rawTotal: number;
  maxPossible: number;
  normalizedTotal: number;
  band: Band;
  appliedTotalCaps: string[];
  /** Rendered on the report and the PDF. The 105-vs-100 discrepancy is disclosed, not hidden. */
  arithmeticNotes: string[];
}

export interface TalkShare {
  coachWordShare: number;
  /** The cap is phrased in TIME; we can only measure words. Publish the interval. */
  coachTimeShareLow: number;
  coachTimeShareHigh: number;
  rateRatioRange: { min: number; max: number };
}

export interface RedFlag {
  severity: "HIGH" | "MEDIUM" | "LOW";
  text: string;
  /** Transcript line this rests on. Same derivation rule as EvidenceRow.line. */
  line: number;
}

export interface ReportContract {
  runId: string;
  callType: "kickoff" | "coaching";
  coach: string;
  client: string;
  transcriptSha256: string;
  /** ISO 8601. The report shows finished-vs-still-going from this plus `status`. */
  finishedAt: string | null;
  status: "running" | "finished" | "failed";
  /** Populated only when status === "failed". A failed run says why. */
  failureReason: string | null;

  dimensions: DimensionReport[];
  caps: CapReport[];
  total: TotalReport;
  talkShare: TalkShare;

  // ---------------------------------------------------------------------------
  // ** NOT YET PRODUCED BY THE SCORER ** — three of the brief's six report items.
  // Until they land, render-report.mjs reads them from fixtures/report-copy/<run>.json.
  // ---------------------------------------------------------------------------

  /** "The one thing." The single change that moves the number most. */
  oneThing: {
    /** One imperative sentence to the coach. */
    text: string;
    /** Which dimension it lifts, so the counterfactual is computed, not asserted. */
    dimensionId: string;
    /** The score that dimension would reach. The new total is derived from this in code. */
    wouldScore: number;
  } | null;

  /** "The brief." A few sentences on how the call went, written to the coach. */
  brief: string | null;

  /** "Red flags." What puts this client at risk of leaving, and why. */
  redFlags: RedFlag[] | null;
}
