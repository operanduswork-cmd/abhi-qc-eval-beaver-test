import type { Cap } from "./types.ts";

/**
 * Caps, compiled as ENUMERATIONS rather than negatives.
 *
 * Both rubrics say "Before scoring, check these conditions" and "record which cap fired".
 * Two things follow that are easy to get wrong:
 *
 * 1. A cap is not a silent clamp. Luke's reference build renders a fired cap as a red pill in
 *    the report, so the cap is part of the OUTPUT, not just an adjustment to a number.
 *
 * 2. Every one of these is a universally-quantified negative — "no follow-up questions
 *    ANYWHERE", "no connection to long-term vision at ANY point". You cannot establish a
 *    negative by asking for one; you get a yes/no guess. So each is posed as an exhaustive
 *    enumeration of the POSITIVE case, and code computes `absent := verified.length === 0`.
 *    M5 measured this working 10/10 on the adversarial case.
 *
 * Resolution happens once, in the fact pass, BEFORE any dimension is scored. Total caps
 * belong to no dimension; letting all twelve dimension calls emit cap signals would be twelve
 * independently-sampled votes on one global fact, and the tiebreak would be arbitrary.
 *
 * The two talk-share caps are `arithmetic` — resolved in code with no model involvement at
 * all. See lib/transcript/talkshare.ts for the interval and the published tie-break rule.
 */

const EVIDENCE_RULE =
  "Quote verbatim, at least 8 consecutive words, with the line number. Return an empty array " +
  "if there are genuinely none — an empty array is a valid and expected answer, not a failure.";

export const COACHING_CAPS: Cap[] = [
  {
    id: "coaching-cap-booking",
    condition: "Next call NOT booked live during the call",
    scope: "dimension",
    target: "D10",
    clamp: 0,
    // "confirmed by Marcus: 'I don't care if you're at minute 29'"
    nonRecoverable: true,
    resolution: "enumerated",
    enumerates: "absence_case",
    enumerationPrompt:
      "List EVERY instance in this call where the next call was booked LIVE during the call — " +
      "a specific date and time agreed and confirmed, a booking link used and confirmed in the " +
      "call, or an invite sent during the call. Separately, list EVERY statement that defers " +
      "scheduling to after the call, walks back an agreed time, or promises to send times later. " +
      EVIDENCE_RULE,
  },
  {
    id: "coaching-cap-vision",
    condition: "No connection to long-term vision at any point in the call",
    scope: "dimension",
    target: "D3",
    clamp: 10,
    nonRecoverable: false,
    resolution: "enumerated",
    enumerates: "absence_case",
    enumerationPrompt:
      "List EVERY moment where the coach connects the present work to the client's LONG-TERM " +
      "vision, identity, or 12-month outcome — not merely this week's plan or this cycle's " +
      "programme. " + EVIDENCE_RULE,
  },
  {
    id: "coaching-cap-talkshare",
    condition: "Coach speaks >75% of the call (client passive/monologue)",
    scope: "total",
    target: null,
    clamp: 75,
    nonRecoverable: false,
    resolution: "arithmetic",
    enumerates: "absence_case",
    threshold: 0.75,
    enumerationPrompt:
      "Resolved arithmetically from word counts; see lib/transcript/talkshare.ts. The model is " +
      "asked only for the qualitative half — evidence of the client being passive or the call " +
      "being a monologue — which the arithmetic cannot settle on its own.",
  },
  {
    id: "coaching-cap-accountability",
    condition:
      "No concrete accountability commitment the client owns before close — no specific, " +
      "verifiable deliverable the client confirms. A single named anchor OR a progression-gated " +
      'ask ("send me your X video(s) before I progress you", client confirms) both satisfy this ' +
      "and do NOT trigger the cap.",
    scope: "dimension",
    target: "D6",
    clamp: 10,
    nonRecoverable: false,
    resolution: "enumerated",
    enumerates: "absence_case",
    enumerationPrompt:
      "List EVERY concrete, verifiable deliverable the CLIENT commits to before the close and " +
      "explicitly confirms. Both of these count and neither triggers the cap: (a) a single named " +
      "accountability anchor; (b) a progression-gated ask such as \"send me your X video before I " +
      "progress you\" that the client confirms. A vague intention the client does not confirm does " +
      "NOT count. " + EVIDENCE_RULE,
  },
  {
    id: "coaching-cap-struggle",
    condition: "Client struggle present but ignored or avoided",
    scope: "dimension",
    target: "D8",
    clamp: 0,
    nonRecoverable: true,
    resolution: "enumerated",
    enumerates: "firing_case",
    // POLARITY. Every cap here enumerates the case in which it FIRES, so that
    // `supporting.length === 0` means "not fired" uniformly across all of them.
    //
    // This one previously enumerated struggles into `supporting` and the coach's responses into
    // `counter_evidence`, which meant a struggle that was handled WELL came back with both
    // arrays populated and resolved `indeterminate` — on coaching-01, where D8 scored 5/5 and
    // the struggle was plainly handled. Flagged from the outside in HANDOFF-BACKEND.md §8.
    enumerationPrompt:
      "List EVERY moment where the client expressed a struggle, difficulty, setback or " +
      "frustration AND the coach then ignored it, deflected it, or moved on to another topic " +
      "without addressing it. Quote the client's struggle and the coach's next turn together, so " +
      "the omission is visible. " +
      "Do NOT list a struggle the coach engaged with — that is this cap not firing. If no " +
      "struggle arose at all, or every struggle was addressed, return an empty array. " +
      EVIDENCE_RULE,
  },
  {
    id: "coaching-cap-actionsteps",
    condition: "No action steps stated for either party before close",
    scope: "total",
    target: null,
    clamp: 70,
    nonRecoverable: false,
    resolution: "enumerated",
    enumerates: "absence_case",
    enumerationPrompt:
      "List EVERY action step stated before the close, for EITHER party — things the coach will " +
      "do and things the client will do. " + EVIDENCE_RULE,
  },
];

export const KICKOFF_CAPS: Cap[] = [
  {
    id: "kickoff-cap-followups",
    condition: "No follow-up questions anywhere in the call",
    scope: "total",
    target: null,
    clamp: 70,
    nonRecoverable: false,
    resolution: "enumerated",
    enumerates: "absence_case",
    enumerationPrompt:
      "List EVERY follow-up question the coach asks — a question that digs into something the " +
      "client has just said, as opposed to an initial or scripted question that opens a new " +
      "topic. For each, quote the client statement it follows up on as well. " + EVIDENCE_RULE,
  },
  {
    id: "kickoff-cap-talkshare",
    condition: "Coach speaks >70% of the time without client engagement",
    scope: "total",
    target: null,
    clamp: 80,
    nonRecoverable: false,
    resolution: "arithmetic",
    enumerates: "absence_case",
    threshold: 0.70,
    enumerationPrompt:
      "Resolved arithmetically from word counts; see lib/transcript/talkshare.ts. The model is " +
      'asked only for the qualitative half — "without client engagement" — which the arithmetic ' +
      "cannot settle. Note this is the boundary case: kickoff-02 is 73.1% by words but its time " +
      "share straddles 70%, so the arithmetic half returns indeterminate.",
  },
  {
    id: "kickoff-cap-confusion",
    condition: "Client shows unresolved confusion at any point",
    scope: "total",
    target: null,
    clamp: 75,
    nonRecoverable: false,
    resolution: "enumerated",
    enumerates: "firing_case",
    // Same polarity defect as coaching-cap-struggle, same fix: enumerate the firing case.
    // Confusion that the coach resolved is this cap NOT firing, and listing it as supporting
    // evidence made a well-handled call look contradictory.
    enumerationPrompt:
      "List EVERY moment where the client expressed confusion, uncertainty, or a question about " +
      "something they did not understand, AND that confusion was left UNRESOLVED — the coach did " +
      "not answer it, or answered without the client confirming they understood. Quote the " +
      "client's confusion and what followed, so the gap is visible. " +
      "Do NOT list confusion the coach cleared up — that is this cap not firing. Return an empty " +
      "array if every moment of confusion was resolved. " + EVIDENCE_RULE,
  },
  {
    id: "kickoff-cap-northstar",
    condition: "No North Star statement constructed",
    scope: "dimension",
    target: "D4",
    clamp: 10,
    nonRecoverable: false,
    resolution: "enumerated",
    enumerates: "absence_case",
    enumerationPrompt:
      "List EVERY moment where a North Star statement is constructed — an explicit, articulated " +
      "statement of the client's central long-term outcome, built during the call rather than " +
      "merely alluded to. " + EVIDENCE_RULE,
  },
  {
    id: "kickoff-cap-recap",
    // Not in the global cap table — buried inside D11's own criteria.
    condition: "No structured recap → max 3/5 on D11",
    scope: "dimension",
    target: "D11",
    clamp: 3,
    nonRecoverable: false,
    resolution: "enumerated",
    enumerates: "absence_case",
    enumerationPrompt:
      "List EVERY structured recap given at the close — an organised summary of what was agreed " +
      "and what happens next, as opposed to a loose sign-off. " + EVIDENCE_RULE,
  },
];

export function capsFor(callType: "kickoff" | "coaching"): Cap[] {
  return callType === "coaching" ? COACHING_CAPS : KICKOFF_CAPS;
}
