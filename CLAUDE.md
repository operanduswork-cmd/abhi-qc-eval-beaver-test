# BeaverMind Stage-2 — call QC evaluator

Hiring exercise. An operator pastes a coaching-call transcript, picks a rubric, and gets a
12-dimension scored report with verbatim evidence, downloadable as PDF.

**Deadline: Tue 25 Aug 2026, 15:00 CEST.** Deliverables: public GitHub repo · live Vercel link ·
Loom with webcam on. Graded by an engineer who built this himself and is explicitly screening out
"AI slop and vibe coders."

**Status:** research complete · design system complete · scorer runs end-to-end
(`eval/out/coaching-01.json`: 96/105 → **91 ELITE**, 132 verified citations, $0.64) ·
report page renders **from that contract**, not from hand-written HTML.
Next: `HANDOFF-BACKEND.md` §8 → the scorer still owes `oneThing`, `brief`, `redFlags`,
and the run-identity fields (`runId`/`status`/`finishedAt`/`failureReason`).

**Before touching the report page, run `npm run validate`.** It re-derives every citation from
the transcript. It exists because the page once shipped three quotes that were in no transcript
at all, and fourteen line labels pointing at the wrong line.

**Stack:** Next.js on Vercel · Supabase Postgres · Claude Opus 5 via **OpenRouter** (not a direct
Anthropic key).

---

## Hard constraints — from the README, not preferences

1. **Every run has its own URL** that still resolves next week, shareable without a login.
2. **The operator can close the tab.** Scoring keeps running; returning to the URL shows
   finished-or-still-going.
3. **A failed run says why.** Never a spinner that spins forever.
4. **Evidence or nothing.** Every score carries verbatim transcript lines. Absent behaviour is
   *stated*, never guessed, never inferred from mood.
5. **The PDF is what the client sees.**

Plus: *"no scope you were not asked for"* is an explicit grading criterion. Kick-off and coaching
calls scored from a pasted transcript is the whole surface.

---

## The eight corrections

Each of these reverses an obvious instinct. They came out of a 13-agent research pass and are the
reason the build isn't naive. **Do not quietly revert one.**

1. **The quote is the key; the line number is a hint.** Do *not* verify a quote against the line
   the model cited — models get prepended line numbers wrong routinely, and one off-by-one floors
   a dimension that was actually fine. Search the normalised quote across the whole transcript,
   map back to the original span, derive the line in code. Enforce ≥8 words (8-word quotes are
   99.7–100% unique per transcript; 3-word only 87–94%).
2. **Pin the provider.** `anthropic/claude-opus-5` is served by **nine endpoints** on OpenRouter.
   Three (Vertex) don't support `structured_outputs` — the score enum silently degrades to a hint.
   Two (Azure) accept `temperature`. Unpinned, the determinism claim is indefensible.
   `provider:{only:["anthropic"],allow_fallbacks:false,require_parameters:true}` on every call.
3. **A fact pass runs first.** Total caps belong to no dimension. Twelve calls each emitting
   `cap_signals` = twelve independent votes on the same global fact. One fact pass resolves every
   cap predicate; results inject into the dimension calls as given premises. **Score D12 last** —
   its negative signals *are* other dimensions' outcomes.
4. **Score goes LAST in the output schema.** `evidence[] → cap_signals[] → reasoning → score →
   quick_fix`. Property order is generation order under constrained decoding; a score emitted
   first is one the evidence then rationalises, and the JSON still validates.
5. **Every cap is an enumeration, never a negative.** Not *"were there no follow-up questions?"*
   but *"list EVERY follow-up question with evidence; empty array if none."* Code computes
   `absent := verified.length === 0`.
6. **Caps have three states.** `fired | not_fired | indeterminate`, with `counter_evidence[]`.
   A boolean cannot describe `coaching-01`.
7. **D2 N/A redistributes to D3 and D4** — the rubric's own words. Promote those two maxima and
   scale. Simply dropping D2 from the denominator spreads its points across all eleven survivors:
   a different instrument, and it flips a band in the worked case.
8. **The talk-share caps are phrased in TIME; we can only measure words.** `kickoff-02` is 73.4%
   by word share but ~69.7% by time at plausible speaking-rate asymmetry — the cap flips. Emit an
   interval, publish the tie-break rule, put it on the PDF. The grader will find that boundary.

Also: **`temperature` does not exist** on current Claude models (400 on first-party, silently
dropped via OpenRouter's Anthropic endpoint). Determinism is engineered — fixed enums, arithmetic
in code, evidence gating, content-hash idempotency — never a sampling knob.

---

## The adversarial case — build the test before the UI

`coaching-01` is designed to catch a system that guesses. It's a warm, likeable call. At **L188**
the client says *"Wednesday the 10th at four… Let's lock that in."* Five lines later at **L193**
the coach says *"I'll get you those times soon so we can get this locked on the calendar."*

They contradict. Coaching D10 is **0/5 non-recoverable** if the next call wasn't booked live.
A correct system reports `indeterminate`, quotes **both** lines, and says which branch it scored.

That single requirement is why caps have three states and why the report layout must hold a
contradiction. No amount of styling fixes it later.

---

## Where things live

| | |
|---|---|
| `BRAINDUMP.md` | **Single source of truth**, ~1060 lines. Full rubric mechanics, all research findings, decisions log. Read before changing an architecture decision. |
| `HANDOFF-BACKEND.md` | Backend working doc — probes, schema DDL, pipeline order, block plan. |
| `exercise-source/` | The brief: README, both rubrics, four transcripts. Never edit. |
| `design/` | Design system — 4 artboards, `preview.html`, curated reference frames. Frontend is settled. |
| `~/Downloads/QC-EVALUATOR-DESIGN-SYSTEM/` | Packaged design system incl. `assets/` (self-hosted fonts, logo, tokens.css, 31 icons). |

**Working rule: append findings to `BRAINDUMP.md`. Do not spawn new files.**

---

## Cut deliberately — each named in the Loom

Auth (breaks the shareable-URL constraint) · coach/client directories · sales-call and
strategic-review rubrics (*"can be ignored"*) · the `YOUR FEEDBACK` panel (*"please ignore"*) ·
retrieval/embeddings (rejected on correctness — a reranker would surface L188 and bury L193) ·
a calibration layer (no human-scored ground truth exists to calibrate against).
