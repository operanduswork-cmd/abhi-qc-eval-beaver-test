# BeaverMind Stage 2 — Braindump

Running notes on the BeaverMind AI-Native Developer Stage-2 exercise. Not a spec, not a
plan. Just everything we've dug up, recorded so it survives the session.

**Deadline: Tue 25 Aug 2026, 15:00 CEST / 09:00 US Eastern.** Today is Fri 21 Aug. ~4 days.

> **Note on tooling (21 Aug, ~10:45).** This exercise was briefly handed to a cortextOS agent
> fleet — a local daemon supervising long-lived `claude.exe` / `codex.exe` sessions. The
> implementation agent (`builder`, opus-5) was given the full brief and a scoped analysis task
> at 01:55. It ACKed, started reading the transcripts, and then **produced nothing for 8.7
> hours** before dying silently; its heartbeat went stale and no deliverable was ever written.
>
> The orchestration layer was torn out and the work moved to plain Claude Code. Two real
> cortextOS bugs surfaced on the way and are recorded in `ctos/PATCHES.md`: `CTX_AGENT_NAME`
> being derived from the cwd basename (so any folder with a space breaks every bus command),
> and org-less tasks being silently invisible to org'd agents (which had also stranded an
> unrelated task for three days).
>
> Kept here because it is honest project history, and because "I tried the orchestration layer,
> it cost me a night, I cut it and shipped without it" is a better answer on camera than
> pretending the straight line was the only line.

**Working rule: everything we discuss goes in this file.** Every question asked and answered,
every conclusion, every decision. Append — don't spawn new files.

---

## Sources pulled (and how)

| Source | How | Where it landed |
|---|---|---|
| `exercise-video-1080.mp4` (8:33, 1920×1166, 47MB) | AssemblyAI `universal-2` w/ speaker labels | `.transcript.{txt,srt,json}` in session scratchpad |
| Same video, visuals | ffmpeg scene-aware extraction, 71 frames @768px | scratchpad `watch-exercise/frames/` |
| `ops.beavermind.ai/hiring-ai-dev/exercise` | curl + regex strip. **WebFetch was useless** — it summarised instead of reproducing | scratchpad `exercise.html` |
| `github.com/lukecala/hiring-ai-dev-exercise` | `git clone --depth 1` | scratchpad `repo/` |

Note: no Whisper key configured for the `/watch` skill, so the video's own transcript came
back empty — AssemblyAI (`/transcribe`) is what produced the text. Chrome extension isn't
connected on this machine either, so browser automation was a dead end.

**All of the above is in the session scratchpad, which is ephemeral.** If we want the repo
locally it needs re-cloning into the project.

---

## The ask, in one paragraph

An operator pastes a call transcript into a page, says whether it's a **kick-off** or a
**coaching** call, and the system scores it against that rubric and returns a report they can
download as a PDF. Every run gets its own URL that still works next week. The scoring survives
the tab closing. A failed run says why.

---

## Plain English — what this actually is

Stripped of everything:

**Given to you, fully written:** both scoring rubrics. Every dimension, every point value,
every band, every cap, every "score X when…" criterion. All 24 dimensions across the two
files. **You invent none of it.** You don't guess what "Elite" means — it's defined.

**Not given:** how to make a model actually follow it *the same way every time.*

Why that's hard, concretely. The kick-off rubric says D1 Strong = **6–8 points**, "score 8 when
the gap is minor… 6 when prep is real but uneven." A human reads that and picks. Paste it into
a model and run it three times on the same transcript → 7, then 6, then 8. All three legal by
the rubric. But the coach's total just moved 2 points and their **band can flip**. The client
uses this to decide which coaches are underperforming. **A score that wobbles is worthless to
them.** Now multiply by 24 dimensions.

So the job isn't "read the rubric." The rubric is right there. It's:

- chop 28KB of human prose into something a model can execute
- stop it wandering between runs
- force it to quote real transcript lines instead of inventing them
- handle caps, which sit in a table at the top and change the answer *before* scoring starts

**Analogy:** they handed you the recipe — every ingredient, every step. The exercise is
building the kitchen that turns out the same dish every single time. Not figuring out what the
dish is.

Their own phrasing of the same point:

> *"These are grading documents **written for humans**. They are not instructions to a model,
> and nobody has adapted them into any. Turning one into something that scores a transcript
> **the same way twice** is the work."*

---

## Who's grading, and the framing they set

Two speakers in the video.

### Ruben Davoli (founder) — 0:00–2:35

- More applications came in than expected, still arriving as he records.
- No bandwidth to interview even a *selection* of applicants → they built "a fair test."
- **"The goal is not to have a perfect outcome. We don't expect that."** What they want is how
  you think, how you work, the decisions you make.
- Not an invented task: *"an actual task from one of our eight-figure coaching clients…
  something we have already done a few months ago. So we know exactly how we had to tackle the
  task from start to finish."* There is a benchmark.
- Took them **roughly 3–4 hours** back then. He expects ~3 hours or less now "because a lot of
  information are reorganized."
- **Some information is deliberately unclear.** Normally you'd ask the client. Don't ask them
  before submitting — raise it in the video instead: *"I've done X because I wasn't sure about
  this."*
- He explicitly names both valid postures: sometimes you must ask before working; sometimes
  the better move is *"a proactive approach where you start doing the thing anyways and then
  you ask questions and feedback with the thing already built, to not waste time."*

### Luke Cala (Head of AI Delivery) — 2:35–8:33

This is the sharper half and it's worth quoting because it's the actual grading posture.

- *"I'm going to avoid the AI slop and the vibe coders. I'm not willing to have a classic
  person who is going to transcribe this video and say to Claude 'build this for Luke' and
  paste in the transcript and come up with a solution. This is not the right way to create
  client jobs."*
- Looking for: **engineering mind, criticism, taste for UI, appropriate guidance for the
  coaching/marketing side of the business.**
- *"I don't need any one of you building this because I already built this in first person,
  firsthand, back then when the client needed this."* He extracted and isolated the exercise
  specifically **to put yours against his.**
- What he's testing: *"if you reason properly… your decoding skills, starting from goals and
  needs in order to decode inside actual tasks and then come up with a custom solution."*

### The client context Luke gives

- Coaching-based business. Coaches, coaching calls.
- The pain: **QC'ing every call to know which coach performs best and worst.**
- What they were doing wrong: taking the Fireflies transcript, pasting it into ChatGPT or
  Claude with the rubric, saying "go do a full evaluation." That's the anti-pattern.
- What they built instead: **an emulation system / emulation environment** so the client could
  test it before scaling it up.
- The exercise is one extracted piece of that.

---

## Deliverables — three, all mandatory

1. **Public GitHub repo.** Source, readable without an invite. Do *not* open a PR against
   their repo.
2. **Live Vercel link.** Deployed, so they can paste a transcript in themselves.
3. **A Loom, webcam on.** What you built and why, the trade-offs, what fought you, and what
   you would have asked the client. *"No tool can write this part for you."*

Send all three to **support@beavermind.ai**, or reply to their last email.

---

## The four rules (page: "The rules — four of them")

1. **"There is nobody to ask."** Framed as the client's real condition, not an invented test.
   Where the brief is silent: decide, build the best version, carry on, and say in the video
   what you'd have asked and what you assumed instead. *"We are reading how you move when
   nobody answers."*
2. **Three or four hours, and it may take you less.** That's the **ceiling, not a target to
   fill.** *"Knowing what to leave out is part of the job. An honest partial build beats a
   missed deadline — send it and say so in the video."*
3. **Supabase and Vercel, unless you have a reason.** Both free at this size and they want to
   click around in your app. BYO API key or subscription for the model.
4. **Any tool while you build, AI included, and no scope you were not asked for.** *"Use what
   you would use on a Tuesday."* Kick-off and coaching calls scored from a pasted transcript
   is **the whole surface**. No voice agent.

---

## On the "3–4 hours" — what it actually means

Came up as a question, worth pinning down because it's easy to misread as a stopwatch.

**It isn't one. It's a scope calibration.** All three sources say the same thing:

- **Ruben (video):** *"this task took us roughly three to four hours back in the days. So you
  should expect to take probably three hours or less **because a lot of information are
  reorganized**."* — they scoped it from a blank page; we get it pre-scoped, so it should be
  *faster*, not equal.
- **Page:** *"Three or four hours, and it may take you less. That is what this took to scope,
  so that is the **ceiling, not a target to fill**."*
- **README:** *"Do your best inside it. **Knowing what to leave out is part of the job.**"*
- **Luke (video):** *"I know it will take three to four hours, but do your best."*

**There is no time-tracking anywhere in the submission** — repo, Vercel link, Loom. They can't
verify hours and aren't trying to. The number communicates *how big the thing is supposed to
be.*

What follows:

1. **The real hard gate is the deadline**, Tue 25 Aug 15:00 CEST. Explicitly: *"An honest
   partial build beats a missed deadline — send it and say so in the video."*
2. **The enforceable half of the rule is "no scope you were not asked for."** That *is* visible
   in the repo. Auth, a coach leaderboard, a Sales-call scorer, a voice agent — all fail the
   same test overrunning the hours would. Note that Luke's own UI shows **Sales call** and
   **Strategic review** cards and he tells you on camera to ignore them. Trap in plain sight.
3. **Cutting is graded — but only if narrated.** "Knowing what to leave out is part of the job"
   + "tell us what you would have asked and what you assumed instead" means a thing left
   unbuilt *and named in the Loom* scores better than the same thing left silent. The omission
   isn't the mark against you; the unexplained omission is.

Practical read: build at that altitude, then spend what would have been gold-plating time on
(a) the Loom and (b) making the twelve dimensions actually correct against the rubric. Luke is
grading reasoning against his own build and said outright he's screening out people who pipe
the transcript into a model.

---

## The report contract

Stated as *"This is the output, not a suggestion for one. Every item comes from the report the
client reads today."*

- **The one thing** — the single change that moves the number most, **and what the call would
  have scored with it.**
- **The brief** — a few sentences on how the call went, *written to the coach*.
- **Red flags** — what puts this client at risk of leaving, and why. *"A good-looking score
  can still hide one."*
- **A grade and a total** — score out of 100 and the band it lands in: **Elite, Strong,
  Inconsistent, At risk, Fail.** *"Both rubrics define the bands; use their names, not your
  own."*
- **Twelve dimensions, each one openable** — score out of its maximum, the reasoning, the
  transcript lines that reasoning rests on, and **the quick fix**: what the coach had to do to
  reach full marks.
- **A download PDF button** — same report as a file. *"Taste in how it looks earns points."*

Plus the evidence rule, stated three separate times across the page, README and rubrics:

> When a behaviour is not in the transcript, the dimension **says so**. It does not guess and
> it does not read the mood of the call. **One of the four transcripts exists to catch a system
> that guesses.**

---

## Hard constraints (README, "Constraints")

- **Every run has its own URL.** Paste → get a link → send it to a colleague → they see the
  same evaluation. Open it next week, still there.
- **I can close the tab.** Evaluation keeps running once the browser is gone. Coming back to
  the run URL, it has finished or is still going — **and either way the page tells you which.**
- **A failed run says why.** *"Not a spinner that spins forever."*
- **Evidence or nothing.** Every dimension score carries verbatim transcript lines.
- **The PDF is what the client sees.**

---

## Luke's reference build — what's actually on screen

From frames ~5:00–8:14. This is the thing being graded against, so detail matters.

### Run page

- Header: hamburger · logo · **"QC Evaluator"** · centre search "Search clients…" with `⌘K`
  chip · theme toggle · clock `14:36 EDT` · green **LIVE** indicator.
- Title: **"Run an evaluation"** / sub: *"Score one call at a time against its rubric."*
- Fields, stacked: `COACH` (Search coach…, dropdown) · `CLIENT` (Search client…, dropdown) ·
  `PROGRAM (OPTIONAL)` (placeholder "e.g. Q2 cohort").
- **"Choose the call to evaluate"** — four cards in a row, each with an icon and a `Run →`:
  **Sales call · Kick-off call · Coaching call · Strategic review.**
- Footnote: *"Runs from this page are flagged as mock (`is_emulator_test=true`) and queued for
  cleanup before prod."*
- **Luke on camera: only kick-off and coaching are in scope.** Sales call and Strategic review
  → *"This can be ignored as well."* Client/coach names → *"put placeholders, or leave it as
  it is."*

### Report page

- Breadcrumb: `FULL ANALYSIS / COACHING CALL`
- H1: client name (`Nick Battley`) with an external-link arrow; beneath, *"Coached by **Mark
  Sneddon**"*, also linked.
- Top right: `▶ Watch recording` · **`⬇ Download PDF`** (dark filled button) · `evaluated 2h ago`
- **The one thing** as a large quoted pull-quote, serif-ish, wrapping two lines:
  *"Build belief by connecting every current block to Nick's named 12-month vision and getting
  him to articulate why the outcome matters."*
- **The brief** directly beneath in grey body text, written to/about the coach:
  *"Mark was technically attentive and excellent at adapting the plan when Nick became worried,
  but he coached the exercises more effectively than he coached the journey. Nick left relieved
  and with another call booked, yet the call lacked the long-term belief, singular
  accountability anchor, and timed follow-up chain needed for a strong retention experience."*
- **Cap chip** — pink/red pill: `⊳ Capped: No connection to long-term vision at any point in
  the call`. So **fired caps are surfaced in the UI as first-class objects**, not buried.
- **Score gauge** — semicircular arc, red→amber, large `67` with `/100` beside it, and
  **`AT RISK`** underneath.
- Right rail: a vertical `COACHING` label with a column of small dots — one per dimension,
  jump nav.
- **Twelve numbered collapsible rows.** Each: index · title · score chip right-aligned. Some
  rows carry a small ★ (flagged/attention).
- **Expanded row** contains, in order:
  - reasoning paragraph, always opening with the score and "because…"
    (*"Scored 7/10 because the coach asked how Nick was doing, how the diagnostics felt…"*)
  - **`EVIDENCE`** — verbatim indented quotes, format `"Coach: "So how's it going, Mark, all
    right?""`
  - **`QUICK FIX`** — boxed on light grey, phrased as *"To reach 10/10: ask separately about
    body, biggest win, and hardest moment; reflect Nick's answer back; then tailor the intention
    explicitly, such as, '…'"*
- A **`YOUR FEEDBACK`** side panel on expanded rows — "WHAT'S WRONG?" with chips
  (Score too high / Score too low / Wrong evidence / Other), a RATIONALE textarea *"Why is the
  AI wrong? Cite the moment in the call."*, a SUGGESTED SCORE input `0–10 /10` and an `AI: 7`
  readout. **Luke: "Please ignore your feedback section. There's no need to do so."**

### Dimension titles + scores visible in his demo

Titles map 1:1 onto the **coaching** rubric. Directly observed:

| # | Title | Score shown |
|---|---|---|
| 1 | Check-in & connection | 7/10 |
| 2 | Diagnostics review ★ | 3/10 |
| 3 | Program focus + vision ★ | 5/15 |
| 4 | Movement coaching quality | 10/15 |
| 5 | Adjustments & strategy | 10/10 |
| 6 | …accountability | 10/15 |
| 7 | …anchor | 3/5 |
| 8 | Struggle handling | 5/5 |

Those eight sum to **53**. Total displayed was **67/100**, so D9–D12 (max 5 each) accounted
for ~14/20. *Inference, not observed.*

⚠️ Note what that implies — see the points-total problem below. His own build reported **67
/100** on a rubric whose dimensions sum to 105.

---

## Rubric mechanics

Two rubrics, twelve dimensions each. They are **structurally different from one another**, and
that difference is most of the work. README says it plainly:

> *"These are grading documents written for humans. They are not instructions to a model, and
> nobody has adapted them into any. Turning one into something that scores a transcript the
> same way twice is the work."*

### Kick-off rubric (28KB, 326 lines)

**Scoring style: band-based.** Any integer inside the band; half-steps allowed where the
dimension max is ≤5. *"A call that clearly exceeds Mid but does not fully meet Elite belongs in
the Strong band. Rounding down to Mid needs a stated reason."*

| # | Dimension | Pts |
|---|---|---|
| 1 | Pre-Call Preparation | 10 |
| 2 | Rapport & Tone | 10 |
| 3 | Agenda Framing | 5 |
| 4 | Goal Alignment & Deep Why | 15 |
| 5 | Program Explanation (3 Phases) | 10 |
| 6 | Journey & Expectation Setting | 10 |
| 7 | Support System Clarity | 5 |
| 8 | Coaching Intelligence Questions | 10 |
| 9 | Next Steps & Diagnostics | 10 |
| 10 | Booking Next Call | 5 |
| 11 | Close, Recap & Confidence | 5 |
| 12 | Post-Call Execution | 5 |

**Sums to exactly 100.** ✓

**Global auto-caps** — checked *before* scoring, and you must **record which cap fired**:

| Condition | Cap |
|---|---|
| No follow-up questions anywhere in the call | **Max 70 total** |
| Coach speaks >70% of the time without client engagement | **Max 80 total** |
| Client shows unresolved confusion at any point | **Max 75 total** |
| No North Star statement constructed | Max 10/15 on D4 |

Plus a local one buried in D11: **no structured recap → max 3/5.**

**Domain canon it expects you to honour:**
- Halden Method 3 phases: **Movement Retraining → Movement Remodeling → Movement Integrating.**
  Legacy synonyms accepted: Reset/Baseline → Build/Strength → Freedom/Mastery. Explicitly:
  *don't* penalise canonical naming.
- Client archetypes: **Doer / Controller / Worrier / Follower.**
- Named loss dimensions: **D4 is #1**, **D6 is #2**, **D9 is #3** ("per Marcus's analysis").

**Calibration Anchors section** — the last ~25 lines, drawn from "real reviewer corrections."
Its entire purpose is anti-conservatism:

> *"The most common failure mode is collapsing borderline cases into the Mid bucket — the
> Strong band exists precisely for them."*

Specific anchors: D1 credit conduct over disclosure (no "I read your notes" needed) · D3
natural sequenced agenda phrasing is Elite, not Mid · D5 accept the canonical Halden naming ·
D10 **verbal** booking is Elite even without a visible calendar invite · D12 informal
commitments ("I'll get your diagnostics done over the weekend") are Mid (2–3), **not** Fail.

This is a real tension to resolve: "score conservatively when evidence is absent" vs "stop
collapsing to Mid." The rubric itself splits the difference in Principle #4 — *"score in the
lower tier of the band the call belongs to. This is NOT a license to drop into a lower band
entirely."*

### Coaching rubric (32KB, 420 lines)

**Scoring style: discrete buckets.** *"Each dimension's score must be exactly one of the bucket
values listed in its table. No interpolation."* Opposite of the kick-off rubric.

Three pillars: **Connection, Confidence, Continuity.**

| # | Dimension | Pts | Pillar |
|---|---|---|---|
| 1 | Check-In & Connection | 10 | Connection |
| 2 | Diagnostics Review | 10 | Value |
| 3 | Program Focus + Vision | 15 | Emotion |
| 4 | **Movement Coaching Quality — optional** | 15 | Support |
| 5 | Adjustments & Strategy | 10 | Goals |
| 6 | Action Steps & Accountability | 15 | Journey |
| 7 | Accountability Anchor | 5 | Journey |
| 8 | Struggle Handling | 5 | Connection + Confidence |
| 9 | Close Quality | 5 | Confidence |
| 10 | Next Call Booking | 5 | Continuity |
| 11 | Continuity & Follow-Up Clarity | 5 | Continuity |
| 12 | Structure & Time Management | 5 | Flow |

### 🚨 The points don't add up

**Those twelve sum to 105, not 100.**

The document states, twice, that the total is **100 with D4 active and 85 with D4 disabled**
(100 − 15 = 85 ✓ internally consistent). But for that to hold, the other eleven must sum to 85.
**They sum to 90.** There's a **5-point discrepancy** in the client's own rubric.

The kick-off rubric sums correctly, so this isn't a systematic thing — it's specific to the
coaching rubric.

This is almost certainly one of the things Ruben meant by *"there are information that might
not be 100% clear in some cases **on purpose**."* Whatever we do — normalise `raw/105 × 100`,
drop 5 points somewhere, or report raw against a stated denominator — it's a decision that has
to be made explicitly and defended in the Loom.

And note Luke's own build displayed **67/100** on this rubric, which reads as raw-with-a-/100-
label rather than normalised. Unconfirmed.

**Global auto-caps** — note how different in character these are from the kick-off ones. Mostly
**dimension-level and non-recoverable**, not total ceilings:

| Condition | Cap |
|---|---|
| Next call NOT booked live during the call | **0/5 on D10 — non-recoverable** |
| No connection to long-term vision at any point | Max 10/15 on D3 |
| Coach speaks >75% of the call (client passive) | Max 75 total |
| No concrete accountability commitment the client owns before close | Max 10/15 on D6 |
| Client struggle present but ignored or avoided | **0/5 on D8 — non-recoverable** |
| No action steps stated for either party before close | Max 70 total |

Marcus on D10, quoted directly in the rubric: *"Book your next call on the call. Always. I
don't care if you're at minute 29. I don't care what the situation is. 100% of the time needs
to happen."*

### D4 is optional and it changes the denominator

If **all four** of these are absent, D4 is disabled:

1. Client performed any live movement during the call
2. Coach gave setup / breathing / control cues in response to a movement
3. Video review of a recorded movement attempt with real-time feedback
4. Coach gave real-time form correction while the client moved

If even one is present → score normally, `disabled: false`.

When disabled the rubric wants: `disabled: true`, a short `disabled_reason`, `score: null`,
`band: "N/A"`, and `max_possible: 85` in `total_score`. Then Principle #6: *"the call is scored
out of 85, not 100. The percentage is the raw score over 85. **Report the result on the 100
scale.**"*

So there's a real normalisation path already specified for the D4 case — which makes the
105-vs-100 gap above even odder.

### Defaults that punish a naive implementation

Easy to miss, and each one flips a "missing → low score" instinct:

- **D8 → 5/5 by default when no struggle is present.** *"Not penalised for a smooth call."*
- **D5 → 7/10 by default when no adjustments were needed** this cycle.
- **D2 → N/A when diagnostics aren't applicable** (non-milestone call, no video submitted) —
  *"redistribute weight to D3 and D4. Do not penalize the coach."* Note this is a **third**
  weight-redistribution rule, and it isn't reconciled with the D4/85 rule anywhere.

### How the score actually computes — the algorithm

Both rubrics run the same five stages. **Order is load-bearing.**

```
1. score each of 12 dimensions
2. apply DIMENSION-level caps    → clamp individual scores
3. sum                           → raw total
4. apply TOTAL-level caps        → clamp the sum
5. normalise (coaching only)     → report on the 100 scale
6. map total → band
```

Both rubrics say caps are checked *"before scoring"* and that you must **record which cap
fired**. That's why Luke's UI renders a fired cap as a red pill rather than silently lowering
a number — **the cap is part of the output, not just a clamp.**

#### Kick-off

- **Dimension scoring is a range.** Band gives a span; pick any integer inside it, half-steps
  where max ≤5. D1 Strong = `6–8`; all three legal. Guidance is qualitative: *"Score 8 when the
  gap is minor and clearly outweighed by solid prep; 6 when prep is real but uneven."*
- **Dimension-level caps:** no North Star → D4 clamped to 10/15. No structured recap → D11
  clamped to 3/5.
- **Total-level caps:** no follow-up questions anywhere → 70 · coach >70% talk without
  engagement → 80 · unresolved client confusion → 75.
- **Sums to exactly 100. No normalisation needed.**

#### Coaching

- **Two gates run first.** D4 disabled (all four criteria absent) → `score: null`,
  `band: "N/A"`, `max_possible: 85`. D2 not applicable → N/A, *"redistribute weight to D3 and
  D4."*
- **Dimension scoring is discrete.** *"Must be exactly one of the bucket values listed. No
  interpolation."* D1 is 10 / 7 / 3 / 0 — **not 8, not 5.** Exact opposite of the kick-off
  rubric and the single most missable detail in the document.
- **Dimension-level caps:** D10 → 0/5 non-recoverable · D8 → 0/5 non-recoverable · D3 → max
  10/15 · D6 → max 10/15. "Non-recoverable" = floor-zero, no other evidence buys it back.
- **Total-level caps:** coach >75% talk → 75 · no action steps either party → 70.
- **Then normalise.** Principle #6: *"the percentage is the raw score over 85. Report the
  result on the 100 scale."*

#### Consequences worth pulling out

- **Caps almost certainly apply on the reported (normalised) scale**, since bands are defined
  0–100. Not stated. Open question.
- **Do total caps stack?** Coaching has two (75 and 70). Presumably lowest wins. Not stated.
- **Talk-share caps are arithmetic, not judgement.** Word-count per speaker off the
  `[Name]: text` format is trivial and perfectly reproducible — computing it deterministically
  instead of asking the model is free accuracy. Caveat: *"without client engagement"* is a
  qualifier the arithmetic alone can't settle.
- **"What the call would have scored with it"** (the one thing) = re-run the total with the
  target dimension at full marks, re-normalise, re-band. Note a fired cap may also lift, which
  can move it more than the dimension delta alone.

#### The determinism problem

README: *"Turning one into something that scores a transcript **the same way twice** is the
work."* The two rubrics make that **differently hard**:

- **Discrete buckets (coaching) are reproducible** — fixed set, model picks one.
- **Bands (kick-off) are not.** "Any integer in 6–8" gives an LLM three legal answers and no
  tiebreak, so the same transcript drifts 6→8 across runs. Nothing in the document solves this.
  **The kick-off rubric is the harder reproducibility problem.**

#### Resolving the 105 → three options

1. **Normalise everything** — `round(raw / actual_max × 100)`. Cleanest: the doc *already
   specifies this exact mechanism* for the D4 case, so it's extending a rule they wrote to a
   base case they missed. Handles D4-disabled, D2-N/A and the 105 gap in one line.
2. **Drop 5 points from a dimension.** Best candidate: **D7 (Accountability Anchor, 5pts) looks
   split out of D6 (Action Steps & Accountability, 15pts) without rebalancing** — same JOURNEY
   pillar, overlapping subject, and the cap table hangs "no accountability commitment" on D6
   while D7 *is* the accountability anchor. Fold D7 into D6 → exactly 100. **My inference, not
   theirs.**
3. **Report raw against a stated denominator** (`67/105`). Honest, but breaks the band table,
   which is defined on 0–100.

Data point, inconclusive: Luke's demo showed **67/100**. If normalised, raw 70 → `70/105×100 =
66.67 → 67`. Suspiciously clean. But raw 67 unnormalised also shows 67, and both land in AT
RISK, so the screenshot can't disambiguate.

### Bands (identical across both rubrics)

| Band | Score |
|---|---|
| **ELITE** | 90–100 |
| **STRONG** | 80–89 |
| **INCONSISTENT** | 70–79 |
| **AT RISK** | 60–69 |
| **FAIL** | <60 |

Descriptions differ slightly per rubric but the names and thresholds match. Page says use their
names, not your own.

⚠️ **Inconsistency worth noting:** the README describes the band range as *"from at risk up to
excellent"* — "excellent" isn't a band name anywhere. Luke also says "at risk / good /
excellent" on camera. The **page and both rubrics** agree on Elite→Fail. Go with the rubrics.

---

## The four transcripts

Format: one speaking turn per line, `[Speaker Name]: what they said`. **No timestamps.** README:
*"the same flat text our pipeline sees in production once it has flattened the recorder
payload."* Synthetic, and *"not all of them are good calls, and that is deliberate."*

Measured directly:

| File | Size | Lines | Coach | Client | Coach talk-share |
|---|---|---|---|---|---|
| `kickoff-01.txt` | 35KB | 146 | Dana Whitlock | Owen Brandt | 67.5% |
| `kickoff-02.txt` | 16KB | 126 | Ivan Petrov | Renata Cruz | **73.1%** |
| `coaching-01.txt` | 36KB | 196 | Priya Raman | Malik Osei | 66.6% |
| `coaching-02.txt` | **65KB** | 345 | Marcus Reid | Hannah Vogel | 63.5% |

### What each one appears to be for

**`kickoff-01` — the strong reference.** Books live and properly: works around the client's
site walkthrough, moves to Thursday the 11th, resolves Mountain↔Pacific out loud (*"four
o'clock my time, which would put you at three o'clock your time"*), and sends the invite
during the call. Commits to filming by Thursday, program by Saturday, start Monday. Sends a
written recap. This is what Elite looks like.

**`kickoff-02` — the thin one.** Coach talk-share **73.1%**, which trips the *"coach speaks
>70% without client engagement → max 80"* cap if you measure it. Booking is explicitly *not*
locked: *"my assistant handles the scheduling on that side, she'll reach out"* / *"I'll just
send you a link once we're a couple weeks in."* Kick-off D10 doesn't hard-zero like coaching
D10 does, but this is Mid/Weak territory. Ends on a slightly deflating note about emailing
support for app issues.

**`coaching-01` — this is the trap.** Genuinely warm call. Priya asks about the knee *"right
now, not the highlight reel version you'd give me in a text"*, remembers the wife and kid by
name, works around a firefighter's 24-on/48-off rotation, builds a rough-shift program
variant, gives a clean two-sided recap. A system reading **mood** scores this Strong or Elite.

But at the close it does this:

> line ~192 — *"Wednesday the 10th at four, yeah, I'm off that day, that one works. Let's lock
> that in."*
>
> line ~197 — *"Alright, go get some rest, **I'll get you those times soon so we can get this
> locked on the calendar.**"*

**Five lines apart, and they contradict.** Coaching D10 is non-recoverable 0/5 if the next call
wasn't booked live. So the whole question is whether the system reads carefully enough to
*notice* the contradiction and say what it can and can't verify — versus pattern-matching
"felt warm, they said a day and a time, booked ✓."

That maps exactly onto the page's *"One of the four transcripts exists to catch a system that
guesses"* and *"A good-looking score can still hide one [red flag]."* Strong candidate for
being the named one. **Not confirmed** — `kickoff-02` is the other plausible reading, since
it's thin enough that a guessing model would hallucinate depth that isn't there.

**`coaching-02` — the long one.** 65,146 characters. README calls this out by name in "What we
do not tell you": *"What to do with a transcript of 65,000 characters."* Books properly
(drops the booking link in chat, client books live, *"We're locked in"*), gives a full
two-sided close with Sunday-night feedback commitment. Movement-coaching signals are low — this
looks like the **D4-disabled / score-out-of-85** case, which would make it the transcript that
tests the optional-dimension path. **Worth verifying by reading it properly.**

---

## "YOU DECIDE" — the six graded decisions

The page renders this as its own callout block. README calls the same list "What we do not tell
you." Closing line, verbatim:

> **"These are the decisions we are hiring for. Make them, then defend them."**

The six, as written:

1. How the rubric reaches the model, and how a scored answer comes back.
2. The tables.
3. The model, and how you get structured output out of it.
4. How work keeps running after the response is sent.
5. Where the PDF is made.
6. What to do with a transcript of 65,000 characters.

*(README's version splits #3 into "which model or provider" + "how to get structured output out
of a language model", and phrases #5 as "whether the PDF renders in the browser or on the
server." Same list.)*

### Two layers — don't confuse them

- **The report contract** (12 dimensions, evidence, the one thing, PDF) = the **pass/fail
  floor.** Get it wrong and nothing else saves you.
- **These six** = **where you get ranked** against Luke's build.

You need the floor. You get hired on the six. Beautiful architecture wrapped around a scorer
that hallucinates evidence gets binned.

**Maximum *thinking* → the six. Maximum *hours* → making the scoring actually correct.**

### What each one is really asking

| # | Plain English |
|---|---|
| 1 | Dump 28KB of rubric in one prompt and ask for 12 scores? One call per dimension? Pre-digest the rubric into something tighter first? And what shape comes back. **This is the "same answer twice" problem — the whole exercise.** |
| 2 | The DB schema. What a run is, what a report is, how the URL still resolves next week. |
| 3 | Which model — and how you *force* valid output every time. Schema/tool-use enforcement vs "please reply in JSON" vs parse-and-retry. |
| 4 | Operator pastes → hits run → **closes the tab.** Scoring must keep going. Background job / queue / webhook. Not `await llm()` inside the request handler. |
| 5 | Browser-side or server-side. Server = consistent output; browser = easier but renders differently per machine. |
| 6 | `coaching-02` is that file. Whole? Chunked? Two passes? And if chunked — **how do you still quote exact lines as evidence?** |

### Ranked by actual impact

1. **How the rubric reaches the model / how the answer comes back** — 🔥 basically the whole
   exercise. Everything else is plumbing around it.
2. **The 65,000-character transcript** — named specifically for a reason. Really a sub-problem
   of #1: chunk it and you risk losing exact quotes; don't chunk and you risk the model going
   vague across 65k of context.
3. **Work surviving the tab closing** — binary, and stated three separate times across page and
   README. Cheap to get right, fatal to skip.
4. **Structured output** — also part of #1. Largely solved if you use schema-enforced output
   instead of asking nicely.
5. **The tables** — bookkeeping. Must be sane; low ceiling on impressing anyone.
6. **Where the PDF is made** — lowest stakes, but *"taste in how it looks earns points"* is
   stated, so don't ship something ugly.

**#1 and #2 are the same problem wearing two hats:** *how do I get the same score twice, with
real quotes attached.* Nail that and be able to explain it on camera, and you're ahead of most
submissions.

### "Then defend them"

*Defend* = the Loom. **A decision made but not explained on camera scores the same as no
decision.** Which is why the Open Questions section below is being kept running — it's the
Loom script.

---

## Anonymisation artifacts — don't over-read these

The repo has been scrubbed by find-and-replace and it shows. Flagging so we don't mistake
noise for signal:

- **Broken grammar from substitution.** Coaching D6 and D11 both contain *"I'll **the video
  tool** you feedback on ___ by ___"* — "Loom" was replaced with "the video tool" mid-verb.
  Same pattern for **"the training app"** and **"the community platform."**
- **Two different anonymisation passes.** The repo says **"Halden Method."** Luke's own
  on-screen build says **"MovesMethod's individualized approach."** Same client, two scrub
  passes.
- **Name collisions.** "Marcus" is the training authority cited throughout both rubrics — and
  also "Marcus Reid," the coach in `coaching-02`. "Priya" is a 94/100 calibration example in
  the kick-off rubric — and the coach in `coaching-01`. "Owen" is the client in `kickoff-01` —
  and appears in the coaching rubric's "Devin → Owen, May 2026" calibration note. These are
  probably not meant to be the same people.
- Luke's demo report is on **Nick Battley, coached by Mark Sneddon, 67/100 AT RISK** — none of
  whom are in our four transcripts. That's his own separate demo data.

---

## Frontend — design system

**Decision: use Claude Design for the UI, built on BeaverMind's own `--bm-*` design system,
re-tuned for data density.** Rationale below.

### What they actually ship

Pulled from `beavermind.ai/colors_and_type.css` + `fonts.css` and the two ops-site
stylesheets. **The homepage and `ops.beavermind.ai` share the same `--bm-*` token names and the
same palette** — this is a real design system, not a one-off page.

```
/* surfaces — INK side */
--bm-canvas   #000322   --bm-surface   #000B45
--bm-surface-2 #001161  --bm-glow      #00187D
--bm-ink #000322  --bm-ink-2 #0B0F2E  --bm-ink-3 #171B3D

/* surfaces — PAPER side */
--bm-paper    #FAFAF7   --bm-paper-2   #F2F2EE

/* accent */
--bm-accent   #6D91F2   --bm-accent-hover #89A6F5   --bm-accent-press #557CE8
--bm-accent-soft rgba(109,145,242,.12)   --bm-accent-ring rgba(109,145,242,.40)

/* text */
--bm-text-on-dark  #F5F9FF   muted rgba(245,247,255,.62)   dim rgba(245,247,255,.38)
--bm-text-on-paper #000322   muted rgba(0,3,34,.62)        dim rgba(0,3,34,.38)
--bm-text-muted #8A94B4  --bm-text-dim #5A6380

/* semantic */
--bm-success #5FE2B0   --bm-warning #F2C46D   --bm-danger #F26D8A

/* hairlines */
--bm-hairline rgba(109,145,242,.14)   --bm-hairline-strong rgba(109,145,242,.28)
--bm-slate-hairline rgba(255,255,255,.06)
```

**Type** — `SF Pro Display` for ≥20px, `SF Pro Text` for <20px, `ui-monospace, SF Mono` for
code. Self-hosted woff2 with otf fallback. (Homepage also preloads *Bricolage Grotesque* from
Google Fonts, but the font-family vars all point at SF Pro — looks vestigial.)

Modular scale, ratio **1.25 (major third)**: `16 · 20 · 25 · 31 · 39 · 49 · 61 · 76`
Semantic: `display-xl 4.5rem · display-lg 3.5 · display-md 2.75 · h1 2.25 · h2 1.75 · h3 1.375
· h4 1.125 · body 1 · small .875 · micro .75`
Line-height: `display 1.05 · heading 1.15 · tight 1.3 · body 1.55`
Tracking: `display -0.025em · heading -0.02em · body 0 · label +0.04em · caps +0.08em`
Weights: `400 / 500 / 600 / 700 / 800`

**Geometry** — radius `8 / 14 / 18 / 999px`. Space `4·8·12·16·24·32·48·64·96·128`.
Ops layout rails: `--rail 1120px · --gutter 24px · --gap-section 128px · --gap-hero 96px ·
--gap-intra 56px · --hero-display 900px · --hero-text 720px`.

**Motion** — `120ms` buttons / `220ms` cards / `420ms` surfaces.
`--bm-ease-standard: cubic-bezier(0.2,0.7,0.2,1)`, `--bm-ease-emphasized: cubic-bezier(0.2,0,0,1)`.

**Shadows** — `sm 0 1px 2px rgba(0,0,0,.4)` · `md 0 8px 24px rgba(0,0,0,.45)` ·
`lg 0 24px 64px rgba(0,0,0,.55)` · accent glow
`0 0 0 1px hairline-strong, 0 20px 60px -20px rgba(109,145,242,.45)`.

### The important finding — it's dual-mode, and the tool lives on paper

The dark-navy hiring page and Luke's light QC Evaluator look like two different design
languages. **They aren't.** The token set has an explicit **ink** side and **paper** side
(`--bm-text-on-dark` vs `--bm-text-on-paper`, `--bm-canvas` vs `--bm-paper`). Marketing runs
ink. **Luke built the internal tool on paper** — off-white ground, near-black navy text, dark
filled buttons, grey small-caps labels, subtle hairlines. Confirmed against the frames.

**So there's no compromise to make.** Build in paper mode and we match their brand *and* Luke's
reference build at the same time.

### Bands map onto existing semantic tokens — no invention needed

| Band | Token |
|---|---|
| **ELITE** 90–100 | `--bm-success` `#5FE2B0` |
| **STRONG** 80–89 | `--bm-accent` `#6D91F2` |
| **INCONSISTENT** 70–79 | `--bm-warning` `#F2C46D` |
| **AT RISK** 60–69 | `--bm-danger` `#F26D8A` |
| **FAIL** <60 | danger, deeper / solid fill |

Luke's demo showed `67 · AT RISK` on a red-amber arc — that's `#F26D8A` already. It fits.

### Where the "fine line" actually is — density, not colour

Inherit the colour, type family, radius, motion and the 1.25 type ratio **wholesale**. That's
free credibility and zero risk.

**Rebuild the spatial rhythm.** Their tokens encode a *marketing* cadence —
`--gap-section: 128px`, `--hero-display: 900px`, display type at 4.5rem. A QC tool rendering
twelve collapsible dimensions with evidence quotes needs the opposite: tight vertical rhythm,
small-caps micro labels (`--bm-tracking-caps`), monospace for scores, hairline dividers doing
the work that whitespace does on the marketing site.

**Loom line:** *"I took their existing design system and re-tuned the spatial scale for an
operator tool rather than a landing page."* Defensible, specific, and shows you looked.

### Open on this

- Self-host SF Pro? Licensing is Apple-restricted for non-Apple platforms. Safer:
  `-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif` — the ops CSS already
  falls back exactly that way. Visually near-identical on Mac, which is what they'll open it on.
- Do we offer a dark mode? Luke's build has a theme toggle in the header. Nice-to-have, and
  "no scope you were not asked for" says probably not. Ship paper only unless time is free.

---

## Open questions / raw material for the Loom

They *want* this list — it's explicitly what the video is for. Keeping it running.

1. **The coaching rubric sums to 105, stated as 100.** Normalise, drop 5, or report raw against
   a stated denominator? Which dimension loses points if we drop?
2. **Three separate weight-redistribution rules** (D4-disabled→85, D2 N/A→redistribute to
   D3/D4, and the 105 gap) that are never reconciled with each other. What happens when D2 is
   N/A *and* D4 is disabled?
3. **Talk-share caps require measuring talk-share.** Is that computed deterministically from the
   transcript (word count per speaker, which is trivial and reproducible) or asked of the model
   (which won't be stable)? Deterministic seems obviously right — but "without client
   engagement" is a judgement the arithmetic can't make alone.
4. **Which speaker is the coach?** No role labels in the transcript — only names. Inferred, or
   asked of the operator at run time? Luke's UI has a COACH field, which hints at the latter.
5. **"What the call would have scored with it"** (the one thing) — is that a second scoring
   pass, or a model estimate? Cheap answer: the delta to full marks on that dimension.
6. **`coaching-01`'s booking contradiction** — how should a correct system report it? Probably:
   score the cap, and quote *both* lines as evidence. Saying "I can see a time agreed and then
   walked back" is the honest answer.
7. **Do caps stack?** Coaching has two "max N total" caps (75 and 70). If both fire, is it 70?
   Presumably the lowest wins, but it isn't stated.
8. **README says "from at risk up to excellent"** but every rubric says Elite→Fail. Going with
   the rubrics.
9. **Kick-off's "conservative on missing evidence" vs its own Calibration Anchors** telling you
   to stop collapsing to Mid. The rubric resolves it as "lower tier of the *correct* band" —
   worth stating explicitly since it's the single most quoted tension in the document.
10. **The Sales call / Strategic review cards** in Luke's UI — leave them out entirely, or stub
    them visibly as out of scope? He said ignore. "No scope you were not asked for" says leave
    them out.

---

## Decisions log

**D-01 · Frontend built with Claude Design, on BeaverMind's own `--bm-*` tokens, paper mode.**
*Why:* avoids generic AI-slop UI; Luke explicitly says taste in the UI earns points and that
he's screening out vibe-coded submissions. Their design system is public in their CSS and is
genuinely dual-mode, so using the paper side matches both their brand and Luke's reference
build with no trade-off. Bands map onto existing semantic colours, so nothing is invented.
*Tweak:* inherit colour/type/radius/motion wholesale, rebuild the spatial rhythm for data
density — their spacing is tuned for a landing page, ours is an operator tool.
*Full detail:* "Frontend — design system" section above.

---

## Session log

**Fri 21 Aug 2026** — Pulled and read all three sources end to end: video (transcript +
frames), landing page, exercise repo (README, both rubrics, all four transcripts). Measured
talk-share and booking behaviour across the transcripts. Found the coaching rubric's 105-vs-100
points discrepancy and the `coaching-01` booking contradiction. No code written, no decisions
made.

Then worked through, in conversation:
- **Is "3–4 hours" a limit?** No — scope calibration, not a stopwatch. Deadline is the real
  gate. → own section above.
- **How is the rubric calculated?** Full 5-stage algorithm, both rubrics, cap ordering, the
  band-vs-bucket determinism split. → under Rubric mechanics.
- **Are the rubrics explicitly given?** Yes, fully. What's *not* given is reproducibility.
  → "Plain English" section.
- **Is "YOU DECIDE" the thing to focus on?** Yes for thinking, no for hours. Ranked all six by
  impact. → own section.

Then: scraped `beavermind.ai/colors_and_type.css`, `fonts.css` and both ops-site stylesheets
and extracted the full `--bm-*` design system. Found it's dual-mode (ink/paper) and that Luke's
tool runs on the paper side — which means matching their brand and matching his build are the
same move, not a trade-off. Bands map onto their existing semantic colours. **First decision
logged (D-01, frontend).**

Still open: no architecture chosen, no code. Two things unverified — which transcript is *the*
named "catches a system that guesses" one, and whether `coaching-02` is genuinely the
D4-disabled case (needs a full read of its 345 lines).

**Fri 21 Aug 2026, 01:52–10:45 — orchestration attempt, then teardown.** The brief and the
cloned `exercise-source/` were handed to a cortextOS `builder` agent with a scoped
analysis task (verify the two open unknowns, produce an options brief on the six YOU-DECIDE
calls). It ACKed at 01:58 and started reading the transcripts. **8.7 hours later it had written
nothing** and its heartbeat was stale. The fleet was stood down, the daemon and its scheduled
tasks removed, and the work moved to plain Claude Code. See the note at the top of this file.

**Still open, and now the immediate next step:**
- The **six YOU-DECIDE architecture calls** — none made. This was the agent's whole job.
- **Which transcript is the named "catches a system that guesses" one** — `coaching-01` is the
  working read (booking agreed, then contradicted five lines later); `kickoff-02` is the rival.
- **Whether `coaching-02` triggers the D4-disable path** — needs all four detection criteria
  checked against its 345 lines.

All three are a focused read of four transcripts. Not an 8-hour job.

---

## Architecture research — 13-agent fan-out, Fri 21 Aug ~11:45

9 researchers + 3 adversarial reviewers attacking our three biggest bets + 1 synthesis.
1.3M subagent tokens, 363 tool calls, 29 min. Full synthesis kept at
`…/1d7d64e9-…/scratchpad/synthesis.md` (78KB). Distilled below: only what changed a decision.

### Corrections to this file

- **The `coaching-01` contradiction is at L188 and L193**, not ~192/~197. Verified against the
  file. "Five lines apart" was right; the numbers were not. These go into the rubric pack and
  the report mockup, so the exact values matter.
- **`kickoff-02` coach word-share is 73.4%**, not 73.1%.
- Kick-off is a **hybrid** rubric: 7 of 12 dimensions are discrete buckets, only 5 are ranges
  (D1, D3, D5, D10, D12 — 35 points). Each of those 5 carries its own written tiebreak.
- **`coaching-02` is D4-disabled AND D2-N/A**, firing both unreconciled weight rules at once.

### The determinism boundary — one sentence, and it is the on-camera line

> Deterministic code may **discharge a negative** and may **falsify a claim**.
> It may **never** be positive evidence that a behaviour occurred.

Measured counterexample from this corpus: coaching D1 Elite requires reflective listening
("What I'm hearing is…"). A scan for the whole canonical phrase family returns **0 hits in
coaching-01** — yet L14 and L20 are textbook reflection, phrased without any marker. Lexicon
recall on unseen text is unmeasurable. The other direction is sound: one verified instance
decisively disproves a universal negative.

### Retrieval — rejected on correctness, not on effort

Worth noting OpenRouter exposes `/embeddings` and `/rerank` on the same key, so this was
**not** rejected to avoid onboarding a vendor. It loses on soundness:

1. The caps are universally-quantified negatives. Top-k is open-world: an empty result means
   *not surfaced*, not *not present*. You cannot establish a negative from a sample.
2. **Dense retrieval is structurally worst at exactly our adversarial case.** Ask "was the next
   call booked?" and L188 ("Let's lock that in") is the *high*-similarity passage; L193 ("I'll
   get you those times soon") is decisive and semantically vaguer. A reranker ranks the
   decisive line **lower** — it would actively cause the D10 failure the transcript exists to
   catch.
3. Measured negation performance is **below random**. NevIR pairwise accuracy, random baseline
   25%: `text-embedding-3-large` **22.6%**, RepLlama **13.0%**. Only *LLM listwise* rerankers
   score well — which is just an LLM reading the text.
4. Reranker scores are not batch-invariant, so the top-N cut can shift under concurrent load.
   Nondeterminism, in a product graded on determinism.

Bonus: `gemini-embedding-2` caps input at **8,192 tokens** — embedding our 15.4k-token
transcript would reintroduce the chunking we correctly forbid.

Also rejected, each worth a sentence on camera: fuzzy/Levenshtein quote matching (its motivation
is PDF-extraction noise we don't have; its cost is accepting fabricated-but-on-topic quotes) ·
Anthropic native Citations (documented 400 when combined with `output_config.format`, which we
need) · grouping coupled dimensions into joint calls (the natural grouping is exactly
`{D6,D7,D10,D11}` — precisely the cluster coaching-01 attacks) · Supabase Edge Functions as the
worker (**2s max CPU**) · Vercel Queues (beta; topics partitioned by deployment id, an active
footgun across 30 redeploys) · browser-side PDF (html2canvas rasterises — no selectable text;
*"evidence you cannot select or search is not evidence"*) · a calibration layer (**no
human-scored ground truth exists to calibrate against** — the most impressive available
rejection, because it declines the biggest published win for a stated reason).

### The eight changes that matter

1. **The verifier was backwards.** We planned to check the quote against *the line the model
   cited*. LLMs get prepended line numbers wrong routinely. **The quote is the key; the line
   number is a hint.** Search the normalised quote across the whole transcript, map back to the
   original span, derive the line in code. Statuses: `verified` / `verified_location_mismatch`
   (found, wrong line — accept and warn) / `not_found`. Only `not_found` retries. As originally
   written, one off-by-one turns a present behaviour into a floored score — a false negative
   *in the direction that looks like diligence*, the hardest kind to catch in your own demo.
   Enforce **≥8 words** per quote: 8-word quotes are 99.7–100% unique within each transcript;
   3-word quotes only 87–94%.
2. **Pin the provider.** `anthropic/claude-opus-5` is served by **nine endpoints** on OpenRouter
   under price-weighted load balancing. Three (Vertex) **do not list `structured_outputs`** —
   the enum silently degrades to a hint and 7 becomes emittable. Two (Azure) **accept
   `temperature`**. Unpinned, the reproducibility claim is indefensible.
   `provider:{only:["anthropic"], allow_fallbacks:false, require_parameters:true}` on every call.
3. **A fact pass must run first.** The total caps belong to *no dimension*. If all 12 calls emit
   `cap_signals`, that is twelve independently-sampled votes on the same global fact — they will
   disagree, and the tiebreak becomes arbitrary. Both rubrics literally say *"Before scoring,
   check these conditions."* One fact pass resolves every cap predicate with line-anchored
   evidence; results inject into the 12 as **given premises**. Score **D12 last**, with the other
   eleven in its prompt — D12's negative signals *are* other dimensions' outcomes.
4. **Score goes LAST in the output schema.** Property order is generation order under
   constrained decoding. `evidence[] → cap_signals[] → reasoning → score → quick_fix`. A score
   emitted first is a score the evidence then rationalises, and the JSON still validates so
   nothing catches it.
5. **Rewrite every cap as an enumeration, never a negative.** Not *"were there no follow-up
   questions?"* but *"List EVERY follow-up question, with verbatim evidence. Empty array if
   none."* Code computes `absent := verified.length === 0`. Absence becomes a spot-checkable
   enumeration rather than an assertion.
6. **Caps need three states, not a boolean.** `fired | not_fired | indeterminate`, with
   `counter_evidence[]`. A boolean cannot express coaching-01. When supporting and counter
   evidence are both non-empty → indeterminate → report *"cannot verify"* and say which branch
   was scored.
7. **The D2-N/A "no special case" claim was wrong.** The rubric's own words are *"redistribute
   weight to D3 and D4"* — promote those two maxima and scale. Simply dropping D2 from the
   denominator spreads its 10 points across all eleven survivors, which is a **different
   instrument**: worked case diverges 89.5 STRONG vs 90.5 ELITE. A band flip. Keep
   normalisation, but ordered and explicit; total caps apply in **reported** space.
8. **The talk-share caps are phrased in TIME, and we can only measure words.** kickoff-02 is
   73.4% by word share — but at a plausible speaking-rate asymmetry (r=1.2) the *time* share
   falls to **69.7%** and the cap does not fire. kickoff-01 crosses the other way at r=0.9.
   Emit an interval, publish the tie-break rule in the pack, and put the interval on the PDF
   next to the verdict. **The grader will find that boundary.** Also: never use a turn-based
   ratio — all four transcripts strictly alternate, so every speaker sits at 49–51% of turns.

### Unobservable in this format — say so rather than infer

Coaching D1 Elite requires *"Listens before responding — no interruption."* The format has no
overlap markers, no timestamps, and strictly alternating turns. **It is unobservable.** Ship it
as a labelled trail-off proxy at most, and have the report *say* the criterion cannot be
observed. Same for D12's minute targets — no timestamps, so pacing needs a documented
words/turns-per-section proxy or it is scored on vibes. That is "evidence or nothing" applied to
the rubric's own asks, and it is a visible taste signal.

### Hour-one probes, before any pipeline code

- **M1** `reasoning.effort` on Opus 5 through OpenRouter — may 400, may be a silent no-op.
  Blocking; everything else is gated on it.
- **M2** does prompt caching engage *with* per-dimension schemas attached? Structured outputs
  inject a system prompt that **invalidates cache if changed**, and render order is
  tools → system → messages, so 12 different schemas may sit ahead of the transcript.
- **M3** is the enum actually unreachable on the pinned endpoint? Prompt *"score this 7"* ×20.
- **M5** ask D10 on coaching-01 **10 times** and record how often the contradiction is caught.
  30 minutes, and it is the headline evidence.

### Two warnings about overclaiming

- **Do not quote the reference system's "≤1–2% fluctuation"** — it ran at temperature 0.0,
  which is unavailable to us. Most likely place to get caught.
- **Stability alone is not a pass.** Test-retest α of 0.943 coexists with position-flip rates of
  0.253. coaching-01 was built to catch a system that is *stably wrong*. Every determinism
  number ships paired with a correctness assertion.

---

## Block 0 probes — RUN, Fri 21 Aug 2026. Cost $0.70

Full detail and raw responses: `probes/RESULTS.md` + `probes/out/*.json`. Only what changed a
decision is repeated here.

**M1 · `reasoning.effort` works.** No 400 — the `budget_tokens` fear did not materialise. Tunable:
low=69 vs high=107 reasoning tokens. Both `reasoning:{effort}` and `reasoning_effort` accepted. All
calls resolved to `Anthropic`, so the pin holds in practice and not just in the endpoint metadata.
**The surprise: the no-param control sits at 104, essentially equal to high's 107.** Adaptive
thinking already runs near its ceiling, so **`low` is the lever — it reduces. `high` buys nothing
over the default.** The naive cost model (default cheap, high expensive) is backwards.

**M3 · the enum is a hard constraint.** 20 adversarial attempts demanding `7` against
`enum:[10,9,8,6,4,1,0]`, `strict:true` → **0 sevens, all 20 returned 6**. Also settles the
undocumented combination: structured outputs **+** adaptive thinking work together.

**M2 · a schema change shatters the cache — and this changed the design.** Identical schema cached
6,897 tokens; a different schema cached **0**. Twelve per-dimension schemas would mean twelve
uncached transcripts.

**M2b · but only the ENUM invalidates; the schema NAME is free.** Same name + same enum → 6,880
cached. *Different name*, same enum → **6,880 cached**. Same name, *different enum* → **0**.
So: one shared schema name everywhere, and **group dimensions by enum**.

**Enum census** (measured off the rubric tables, not assumed):
- **Coaching — 4 distinct enums across 12 dimensions.** `[5,3,0]` covers D7,D8,D9,D11,D12 ·
  `[10,7,3,0]` covers D1,D2,D5 · `[15,10,5,0]` covers D3,D4,D6 · `[5,0]` is D10 alone.
  So coaching costs **4 cache misses, not 12**.
- **Kickoff — 7.** `[10,7,3,0]` covers D2,D6,D8,D9 · D3 and D10 have byte-identical bands
  (independently confirming their shared `{5,4.5,2.5,1,0}` enum) · D7,D11 share · D1, D4, D5, D12
  are each unique.

*Rejected:* one universal schema (1 write + 12 reads, ~half the cost) would need the enum to be the
union of all values, putting `7` back in range. M3 proved the hard enum is what stops interpolation.
That is the centre of the submission — cost is the right thing to spend there.

**M5 · absence detection: 10/10.** Ten runs of the D10 booking question on `coaching-01`:
`{"indeterminate": 10}`, both L188 and L193 quoted **10/10**, `booked_live` **0/10**. Evidence was
near-identical every run.

**Correction to this file and to `CLAUDE.md`: the contradiction is a FOUR-line chain, not two.**
The probe surfaced L187, which we did not have:
- **L185** Priya — *"Let's just lock it in right now instead of me chasing you down later…"*
- **L187** Priya — *"what about Wednesday the 10th instead, same four o'clock slot?"*
- **L188** Malik — *"Wednesday the 10th at four… that one works. Let's lock that in."*
- **L193** Priya — *"I'll get you those times soon so we can get this locked on the calendar."*

Caveat kept deliberately: 10/10 is one dimension on one transcript. It is **not** a determinism
claim for the system and must not be reported as one.

### Cost is now measured — `HANDOFF-BACKEND.md`'s "UNMEASURED, do not quote" is discharged

cache-**write** call **$0.155** · cache-**read** call **$0.029** (5.3× cheaper) · avg output
**859 tokens** (278 reasoning) at `effort:high`.

Full run = 13 calls grouped by enum: `kickoff-02` **$0.66** · `coaching-01` **$0.88** ·
`coaching-02` **$1.72** · **one pass over all four = $4.84.** The four pre-build estimates spanned
$0.19–$2.28/run; the truth sits inside that band and the divergence was output tokens, now measured.

Eval sizing deferred to Block 6: 5×4 cold ≈ $24, ~$11 with 1h-TTL reuse, against **$6.30 remaining**
on the key. Either drop to 3 reruns × 2 transcripts (~$3.40) and narrate it, or raise the cap.
Cheaper lever if needed: the 1h TTL costs 2× on write vs 1.25× at the 5-minute default, and all 13
calls of one run finish well inside 5 minutes — only cross-run reuse needs the hour.

---

## Transcript layer built — three corrections to `verified-facts.md`

`lib/transcript/{canonicalise,parse,talkshare}.ts` + `test/transcript.test.ts`, 14 tests green.
Building it against the independently-measured research numbers caught three errors in those
numbers. All three would have shipped into the README or the Loom as confident claims.

1. **The "turns" figures were LINES per speaker.** Recorded as *"kickoff-01 Dana Whitlock 67.53%
   (74 turns / 3996 words)"* — 74 is Dana's **line** count; her **turn** count is 73, because she
   speaks twice in a row at L90. Measured: kickoff-01 74 lines/73 turns · kickoff-02 64/63 ·
   coaching-01 98/98 · coaching-02 175/170. Word counts and shares were all exactly right.

2. **Same-speaker runs are not unique to `coaching-02`.** The note recorded six runs there and
   implied that was the special case. Measured across all four:
   `kickoff-01 [90]` · `kickoff-02 [22]` · `coaching-01 []` · `coaching-02 [46,119,146,225,273,299]`.
   **Three of the four fixtures diverge lineId from turnId, not one.** Any turn-based arithmetic
   drifts on three transcripts. (`coaching-02`'s six were exactly right.)

3. **Word vs char share agree within 0.74pp, not 0.6pp.** The claim was *"they agree within 0.6pp
   on all four fixtures"*; the true maximum is **0.744pp** on `kickoff-02` (word 73.09% vs char
   73.83%). Near-miss, but it is a number that would have gone into the write-up.

### The talk-share tie-break rule, now implemented

`resolveThreshold()` fires a cap only when the **entire** plausible time-share interval exceeds the
threshold; a straddle returns `indeterminate` and the cap is **NOT applied**. A cap is a penalty,
and applying a penalty that cannot be established is guessing — the exact failure the system exists
to avoid. The report states the interval and says which branch was taken.

Ratio bound is `r ∈ [0.9, 1.2]` (coach words-per-minute ÷ client words-per-minute), giving
`coachTimeShare = Wc / (Wc + r·Wl)`, which collapses to plain word share at r = 1 as it must.

**Measured outcome on the boundary case:** `kickoff-02` is 73.09% by words but its time share spans
**69.4%–75.1%**, straddling the 70% cap → **indeterminate, cap not applied**. Both coaching
transcripts sit clearly under their 75% cap. This is the boundary the grader was always going to
probe, and it now has a published rule instead of a guess.

---

## ⚠️ CORRECTION — the "unobservable in this format" claim was mostly WRONG

Found by the adversarial auditor during rubric-pack compilation, then verified directly against
the fixtures. **`CLAUDE.md`'s bullet and `HANDOFF-BACKEND.md` §4 both need amending** — they
currently assert something a grader can falsify with one `grep`.

The claim was: *"the format has no overlap markers, no timestamps, strictly alternating turns,
so coaching D1's 'no interruption' is **unobservable**."* Three of those four premises are false.

**Measured across all four transcripts — 42 non-verbal markers exist:**
`[laughs]`×20 · `[inaudible]`×8 · `[pause]`×3 · `[exertion]`×3 · `[breathing]`×2 ·
`[stepping]`/`[stepping sound]`/`[stepping, breathing]`×3 · `[shuffling]`/`[shuffling sound]`×2

| Claim | Verdict |
|---|---|
| "no overlap markers → interruption unobservable" | **FALSE.** Two independent signals: a turn ending in a mid-sentence em-dash cut-off (2–9 per file), and explicit verbal acknowledgement — `coaching-02` L243 *"sorry go on, you were saying—"* / L244 *"No no, go on, **I interrupted you**—"* |
| "strictly alternating turns" | **FALSE.** Eight same-speaker continuations across three of four fixtures (already corrected above) |
| "physical movement leaves no trace" | **FALSE.** Eleven movement markers. `coaching-01` L48–L86 is Malik audibly performing movements live |
| "no timestamps" | **TRUE.** Verified zero across all four. D12's minute targets genuinely need a documented proxy — this is the one unobservability claim that survives |

### Consequences

1. **Coaching D1's "Listens before responding — no interruption" is SCORABLE.** It must not be
   shipped as "cannot be observed". Saying so would have been the visible taste signal — and
   would have been wrong.
2. **Coaching D4 detection criterion 1 ("client performed any live movement") has DIRECT
   evidence**, not merely narration. `coaching-01` carries eleven such markers.
3. **`coaching-02` remains D4-DISABLED — the eval target survives.** Its only four markers are
   all `[inaudible]` audio dropouts. Checked specifically, because if it had carried one
   movement marker a named eval target would have been invalid.
4. `[pause]` exists (×3), so "no listening pause" is at least partly observable too.

### Implemented

`lib/transcript/parse.ts` now extracts `markers[]` per line and exposes `movementLines` and
`cutOffLines` on the parse result, so D1 and D4 can cite this evidence rather than declaring it
unavailable. Three tests lock the behaviour, including one asserting `coaching-02` has zero
movement markers.

**The general lesson, worth the Loom:** the research asserted an unobservability that felt
rigorous and was flattering to claim, and nobody checked it against the actual bytes for a whole
session. The adversarial audit pass is what caught it. Assertions about a corpus are cheap;
grepping the corpus is cheaper.

---

## Scorer built and the two guess-traps measured — Fri 21 Aug

`lib/scoring/{prompt,score}.ts` + `eval/score-one.ts`. Two real runs found two real bugs, both
of the "a crash becomes a confident wrong answer" family the whole project exists to avoid.

### BUG 1 — a network blip fired five maximum penalties

First full run of `coaching-01`: the fact pass died with `TypeError: fetch failed`. Because it
returned no evidence, every cap enumeration was empty, and an empty enumeration means "fired".
**Five caps fired on a call that had earned none of them**, and the run still printed a score.

Two fixes: transport-level retries in the client (transport errors only — an HTTP or schema
error will just repeat), and `resolveCaps` now takes whether the fact pass actually succeeded.
**"We did not look" is never reported as "it is not there."** An unrun check is `indeterminate`
and is not applied. The run also carries `ok`, and a run with any failure refuses to present a
total at all.

### BUG 2 — the requirement decomposition backfired, and the halo test caught it

Second run scored `coaching-01` **100/100 ELITE, twelve of twelve dimensions maxed**. D10
reported *"2 of 5 requirements missing"* and still took 5/5.

Cause, and it was self-inflicted: the prompt shows only the TOP bucket's requirements, which
turns the question into *"is this Elite?"* rather than *"which bucket is this?"*. Given partial
evidence the model answers yes.

**Fix — the top-bucket gate, in code.** A rubric's top bucket is CONJUNCTIVE: it lists
everything an Elite call does and the call must do all of it. `requirements` is that cell split
into its parts, so if any one is unevidenced or contradicted the top value is by definition
unavailable and the score drops to the next enum value. The rubric's own logic, enforced in
code rather than requested in a prompt. Four tests lock it.

### Results after both fixes

| | `coaching-01` (warm, contradicted booking) | `kickoff-02` (thin) |
|---|---|---|
| total | **91/100 ELITE** | **50/100 FAIL** |
| D10 | **0/5** — contradiction blocks full marks | **0/5**, 3/3 requirements missing |
| quotes | 132, **132 verified, 0 not found** | 55, **55 verified, 0 not found** |
| cost | $0.64 | $1.48 |

**Halo test: passed.** A 41-point spread between the warm call and the thin one. No uniform
inflation.

**Invention test: passed.** `kickoff-02` D8 came back 0/10 with **7 of 7** requirements missing
rather than manufacturing coaching-intelligence questions that were not asked.

**The trap: caught.** `coaching-01`'s booking cap resolves `indeterminate` with both sides
quoted, and the top-bucket gate takes D10 to 0/5.

**Talk-share boundary: exactly as designed.** `kickoff-02` is 73.1% by words, 69.4-75.1% by
time, straddling the 70% cap -> indeterminate, not applied, interval published.

**Zero hallucinated quotes across 187 citations in two runs.**

### Open concerns

1. **Contradiction is being flagged very liberally** — 9 of 12 dimensions on `kickoff-02` had at
   least one requirement with both supporting and contradicting evidence. With the top-bucket
   gate that systematically suppresses top scores. The spread suggests signal is not being
   destroyed, but the counter-evidence prompt may need tightening to "evidence that the
   behaviour did NOT occur or was reversed" rather than anything merely in tension.
2. **`coaching-01` at 91 still has nine dimensions at maximum.** Defensible - it is a strong
   call and the rubric's calibration notes are explicitly anti-conservative - but worth a second
   look before shipping.
3. **Budget: $4.62 of $7 used.** A full four-transcript pass is ~$4.84, so the eval needs a
   top-up or a reduced rerun count.

---

## Worker, run URLs and the determinism number — Fri 21 Aug

`lib/db/queries.ts` · `lib/run.ts` · `app/api/runs/{route.ts,[id]/route.ts}` · `lib/budget.ts`.
Full eval writeup in `eval/REPORT.md`.

### The two §8 bugs, both fixed and both verified

1. **`coaching-cap-struggle` was resolving `indeterminate`** on a call where D8 scored 5/5.
   Cause: **inverted enumeration polarity.** It listed *struggles* into `supporting` and the
   coach's *responses* into `counter_evidence`, so a struggle handled well came back with both
   arrays populated. `kickoff-cap-confusion` had the identical defect.

   Fix: those two enumerate the FIRING case directly, and `Cap.enumerates` now declares which
   side every cap lists — `absence_case` (9 caps) or `firing_case` (2). It was implicit before,
   which is exactly how two of them ended up backwards. Re-polarising the prompts without also
   branching the resolution logic would have inverted both; caught immediately after.
   Now `not_fired`, as it should be.

2. **D11/D12 scored 3/5 with prose arguing 5/5**, D11's quickFix reading *"Already at full
   marks."* Cause: clamping the score in CODE after the model has written its reasoning
   guarantees the two disagree. Fix: the conjunctive rule moved INTO the prompt, so the model
   applies it itself; the code gate stays as a backstop. Both now 5/5 with coherent text.

### Run lifecycle — 11 checks, no API cost (`npm run worker-check`)

POST returns an id in ~1.4s without touching the model · **same transcript → same run id**
(idempotency index) · different rubric → different run · a fresh run reports `running` with
progress · **a stale heartbeat flips to `failed` with a reason** · unknown id → null · junk input
refused with a sentence before anything is charged.

Sweep happens on READ, not on a schedule: Vercel Cron on Hobby runs at most once per **day**, so
a scheduled sweeper is not available on the free tier — and nobody learns a run is dead until
they look at it anyway.

**Bug found and fixed during this:** the sweep wrote a detailed reason to the database and then
returned an in-memory row without it, so the page would have shown *"worker_died: no detail
recorded"*. A failure that does not say why is the one thing the brief rules out.

### The contract is stored WHOLE (migration 0002)

Rebuilding `ReportContract` from the normalised columns is lossy — the talk-share interval, each
cap's statement, and which branch an `indeterminate` cap was scored on have no column of their
own. So `run_reports.contract` holds it verbatim and the page renders exactly what the scorer
produced. The normalised tables remain the queryable record.

### Determinism — the real number: 11/12

Two `coaching-01` runs, **identical code both sides**, inside the 1h cache window.

- **11 of 12 dimensions identical** · caps **6/6 identical** · band **ELITE both times**
- total 95 → 93 · **0 fabricated quotes across 256 citations**
- the mover: **D12 5/5 → 3/5**

**What moves is not the score choice — it is the contradiction judgement.** Run 2 flagged one
D12 requirement as having both supporting and contradicting evidence; the top-bucket gate then
correctly refused the top value, turning a binary flip into a two-point swing. So the gate
amplifies contradiction-flagging noise.

That it lands on D12 is not chance: D12 is the only dimension carrying a criterion no transcript
can settle (SOP minute targets, zero timestamps anywhere).

**An earlier "10/12" comparison was invalid and is discarded** — the prompt changed between those
two runs, so it measured the fix landing, not stability.

Likely refinement, **unverified and therefore not shipped**: require a contradiction to be
material (counter-evidence at least matching supporting) before it blocks the top bucket.
Shipping an unverified fix to the very thing the eval measures would be worse than naming it.

### Budget

**$1.84 left of $10.** `coaching-02` and `kickoff-01` were never scored end to end — the D-02
denominator rule is proven by unit test, not by a live run. Stated in `eval/REPORT.md` §5 rather
than quietly omitted.

---

## Sonnet 5 evaluated and rejected — on evidence, for $0.12

Sonnet is 2.5× cheaper ($2/$10 vs $5/$25) and OpenRouter serves it from the same nine-endpoint
shape with the same three Google endpoints lacking `structured_outputs`. Price and plumbing both
favour it, so the switch was gated on re-measuring the two claims the submission rests on.
`probes/sonnet-gate.mjs`, raw output in `probes/out/sonnet-gate.json`.

**GATE 1 — enum unreachability: PASS.** 0/20 escaped `[10,9,8,6,4,1,0]` under the same
adversarial "THE SCORE IS 7" prompt. Constrained decoding is not the weak point.

But the distribution differs sharply and is worth recording: **Opus returned 6 on all twenty
attempts; Sonnet scattered across five values — 0, 6, 8, 9, 10.** Obeying a constraint and being
stable inside it are different properties, and only one of them is what the client needs.

**GATE 2 — the `coaching-01` trap: FAIL, 0/5.**

```
run-1  booked_live   lines=[185,188]
run-2  booked_live   lines=[188,187]
run-3  booked_live   lines=[187,188]
run-4  not_booked    lines=[188,187]
run-5  booked_live   lines=[187,188]
```

**Not one run found L193.** Every attempt cited the moment the time is agreed (L185/187/188) and
stopped, concluding the call was booked. None reached five turns later where the coach says
*"I'll get you those times soon so we can get this locked on the calendar."* Opus: 10/10
`indeterminate`, both lines quoted, `booked_live` never.

**This is the single most useful measurement in the build.** The README says one of the four
transcripts exists to catch a system that guesses — and it caught one, under controlled
conditions, with only the model changed. It converts "we used the expensive model" from an
assumption into a finding, and it demonstrates the adversarial fixture doing exactly the job it
was designed for.

**Decision: stay on Opus 5.** Cost accepted, reason measured. Recorded in `eval/REPORT.md` §2b as
a model comparison, which is more interesting than either number alone.

---

# The app was showing mock data on three of four screens

Fri 21 Aug, after the first end-to-end pass. Found by using the thing rather than testing it.

The design deck ships every screen fully populated with plausible content, which is exactly what
a design deck should do. Serving it as the app turned that content into claims. Three screens
were affected, in increasing order of how bad it was.

### 1. The landing listed everyone's runs — and that was my bug, not the deck's

`listRecentRuns()` selected the twelve most recent runs and rendered them for any visitor. I wrote
it an hour earlier building the landing and did not think about who could read it.

The report URLs themselves are fine and stay public. A uuid v4 is the whole capability, RLS is on
with zero policies, and there is no enumeration endpoint — that combination is what satisfies the
brief's *"shareable without a login"*. Which is also why **email-gating the reports was rejected**
when it was suggested: a login breaks constraint #1 outright, `CLAUDE.md` already lists auth as a
deliberate cut, and it would stop a shared link working for the person you sent it to, which is
the entire point of the feature.

But a page that *prints the ids* hands that capability to everyone who loads it. So:

- `listRecentRuns()` **deleted**. There is now no "list all runs" query anywhere in the codebase.
- The browser keeps its own ids in `localStorage["qc.runs"]` (capped at 24) and asks about those
  through `POST /api/runs/summary`, which takes a list of ids and returns band and score. You
  cannot ask it for a run whose uuid you do not already hold.
- Opening a report — including one someone shared with you — remembers it, so a link you were
  given joins your list and nothing else does.

Verified with two browser contexts: the shared link opens the full report in a clean profile, and
that profile's landing still lists nothing of anyone else's.

### 2. "MEASURED ON PASTE" was hardcoded

The panel read `196 lines · 35,558 characters · 2 speakers · 66.6% coach talk-share ·
1 [inaudible] · timestamps none · BELOW 75% ON EVERY READING` — as literal HTML, above an **empty
textarea**. It was the most convincing element on the screen and every number in it was
decoration.

It now calls `POST /api/measure`, which runs `lib/transcript/{canonicalise,parse,talkshare}.ts` —
the same code the scorer runs. That is the point: not "reimplement the counting in the browser and
keep it roughly in sync", but *call the thing that will actually score it*.

The difference is measurable. The canonical body of `coaching-01` is **35,557** characters, not
35,558. The design counted the raw paste; the canonicaliser strips the BOM, normalises newlines
and NFC, rstrips every line and drops trailing blanks. One character — and it is the difference
between a number that is true and a number that is nearly true.

The talk-share row now shows the **interval** (`66.6% by word` / `62.4%–68.9% by time`) and the
verdict line reflects the real threshold for the selected rubric rather than always claiming 75%.
Paste `kickoff-02` and it says `THE INTERVAL STRADDLES THE CAP · CAP 70.0%`, which is the
boundary the grader will check.

Empty box → dashes, never the last transcript's numbers.

### 3. The progress screen showed a fixed "9 / 12" — and it was the worst of the three

Screen 3c draws a full in-flight snapshot: `Scoring Malik Osei`, `9 / 12`, twelve dimension rows
with invented scores, and an `EVIDENCE_NOT_FOUND · D10` error card with skeleton lines and a
"Retry this run" button. `renderPending()` served all of it and **appended a real progress box
underneath**.

So a run genuinely at 5 of 12 was served a page reading **9 / 12** in 24pt above the true count in
13pt. Two numbers about the same run, disagreeing, on one screen. And a healthy run displayed a
failure card for a dimension that had not failed.

`progressFor()` now returns the twelve dimensions of the run's own rubric with per-row state, and
`renderPending()` fills the hero, the bar, every row and the error card from it. The error card is
**removed from the DOM** when there is no error. `renderReport()`'s synthetic 3c pre-render — which
baked that snapshot into the static deck — is deleted.

### 4. …and the report masthead named the wrong people on every run

Found while fixing 3. `renderReport()` keeps everything before `<div id="qcReport">` verbatim, and
that includes the masthead: **`Malik Osei` / `Coached by Priya Raman` / `COACHING-01 · E0711E`**.
It happened to be right for `coaching-01`, because the deck was generated from that run. Every
other transcript would have been scored correctly and then headlined with the fixture's names.

The report's own headline lying about whose call it is would have been the single most damaging
thing on the page. Now filled from the contract, escaped, with a fallback for a transcript where
the coach cannot be named.

### How all four happened, and what stops the next one

Every one is the same mistake: **the deck's content is a claim once it is served.** The fix in each
case was to fill it from the run or delete it, never to leave it.

`app/index.html` now carries 21 `data-qc` hooks. Two reasons. It stops the wiring inferring
structure from rendered text — which had already hidden the wrong element three times running,
the list's parent, then `.dv-opt`, then `.dv-card`, taking the page to 0 characters. And every
hook is a place the code must supply a value, so an unfilled one is visible rather than plausible.

---

# Smaller things in the same pass

**A failed run could never be retried.** `runs_idempotency` is unique over transcript + pack +
prompt + model + scorer version, which is what makes the URL stable — and it meant re-pasting a
transcript whose run died resolved to the same already-failed row with `created: false`, so the
worker never fired. A run killed by a network blip was permanently dead and the transcript could
never be scored again. `start()` now detects it and calls `resetForRetry()`, which clears the
error and **deletes the partial dimensions** (the worker upserts by `(run, dimension)`, so stale
rows from the dead attempt would otherwise be mixed into the retry's report). The design's own
"Retry this run" button is honest as a result, and the link already shared starts working rather
than a second URL appearing for the same call.

**The stale-sweep message claimed things that had not happened.** It said *"the last dimension
completed 214s ago"* even for a run where no dimension ever completed. `loadRun` now reads the
committed dimensions **before** deciding the run is dead, and says either "No dimension finished
at all" or "3 of 12 dimensions had finished". The demo of the failed state in `screenshots/` was
produced through the real sweep rather than a hand-written message, for exactly this reason.

**Twelve icons were doing the work of twenty-four.** `lib/report/icons.ts` was keyed `D1`–`D12`
and both rubrics read the same set, so coaching D1 *"Check-In & Connection"* and kickoff D1
*"Pre-Call Preparation"* wore the same two speech bubbles, and so did the other eleven pairs. The
id is positional; it carries no meaning across packs. Re-keyed to `${callType}:${id}`, twelve new
marks drawn for kick-off in the same house style (concrete objects only — a tuning fork for
Rapport & Tone, a ruler for Next Steps & Diagnostics, a paper plane for Post-Call Execution), plus
two call-type marks for the cards on `/new`. 26 total, asserted distinct in the test suite.

**Share beside Download.** The report had one way out. It now has two: a PDF for the client, a
link for the team. It copies `location.href` and confirms inline. That link resolving for anyone
with no login is constraint #1, so it is worth a button rather than the address bar.

**Removed:** the coach / client / program fields (the scorer derives coach and client from the
transcript's own `[Speaker]:` labels via `likelyCoach()`, and nothing ever read program), and an
unwired `is_evaluator_test=true` toggle on the form. Both were controls that looked like they did
something.

**Test count:** 83 → 94 unit, 33 → 66 browser. The new browser assertions are mostly *negative* —
"a fresh browser sees NO other visitor's runs", "an empty box measures to dashes, not to a
hardcoded 196", "progress reports the REAL count", "no mock failure card on a healthy run" —
because the failure mode here is content that looks right, and only an assertion that names the
mock catches it coming back.

`screenshots/` holds all fourteen: every screen in the order an operator walks through it,
desktop and phone, including both landings (a stranger's and the operator's) because that
difference *is* the privacy fix.

---

# Layout and surface, second pass

Asked for after using the reordered app. All of it is presentation; none of it touches scoring.

**The run form now asks for the rubric first.** The deck stacked it paste-then-choose. That order
is wrong for a reason beyond taste: the rubric decides which talk-share cap the measurement panel
resolves against — 75% for coaching, 70% for kick-off — so choosing second means the panel is
right only after a correction. The nodes are *moved*, not re-authored, so the cards keep the
design's own styling and survive a design refresh that copies would not.

**The paste box is half height** (9 rows, was 18). Transcripts run 126–345 lines; no box that
fits on a screen shows a useful fraction of one, so it only has to prove the paste landed and
scroll. The height is better spent on what comes after it.

**Past runs moved from the landing to the form, below the Run evaluation button.** You go to the
landing to start; you come back to the form either to start another or to pick up one you already
have. The landing is now the mark, the name and the way in — nothing else. The list is the same
`[data-runs]` nodes, moved across the document at request time.

**Removed the chrome furniture:** a search field that searched nothing, a clock frozen at
14:37 EDT, and an avatar dot for an app with no accounts. Four of each, across every screen.
Same rule as the rest of this round — a control that looks like it works and does not is worse
than no control.

**The page has its own ground now.** `#332C4A`, the same hue as the `#423A5E` the landing hero,
the progress hero and the report masthead all use, two steps down. At the *identical* value the
landing hero dissolved into the page and read as a hole punched in the card rather than a panel
sitting on it — worth the shade.

**The rainbow runs on all four sides of the card**, not as a stripe along the top. Two-layer
`background-clip`: the card colour clipped to the padding box, the deck's own gradient clipped to
the border box, and a transparent 4px border for it to show through. The deck's top stripe is
hidden so it does not double up. `@media print` undoes all of it — a full-bleed dark ground is a
page of ink and a gradient border prints as a muddy frame, and **the PDF is what the client
sees**.

**The two notice pages got the same treatment.** A mistyped run link and an unknown id do not go
through the deck — there is no run to render — but they are still the product, and dropping to a
white page in a system font reads as a crash rather than an answer. `renderNotice()` is about
twenty lines of self-contained markup with no dependency on the 400KB template.

**One fixture bug found by the suite drifting.** The browser pass now takes longer than
`STALE_MS`, so by the time it reached the progress screen the seeded demo run had honestly been
swept to `worker_died` — the sweep doing exactly its job, and inconvenient. The fixture that
refreshes the heartbeat was bumping `heartbeat_at` alone, which does nothing once the sweep has
already written `status: 'failed'`. It restores the status too now. Worth recording because the
failure looked like a regression in the progress screen and was not.

Browser assertions: 67 → **74**, adding the DOM order, the box height, the history's position
below the button, the absence of the chrome furniture, and the computed page ground and
four-sided border widths.

---

# The progress screen could not show progress, and two bugs hiding behind that one

The report of it was "it's stuck on first scoring forever, so bad". The run was not stuck. It
finished in 243s and scored 65 AT RISK on a transcript written for the occasion, catching all five
facts planted in it. What was broken was the screen.

## The root cause

```ts
const result = await scoreTranscript(pack, {
  onProgress: async () => { await heartbeat(runId); },   // beats, saves NOTHING
});
for (const d of result.dimensions) await saveDimension(runId, d);   // saves all twelve, at the end
```

`progressFor()` counts rows in `run_dimensions`. Those rows did not exist until the loop had
finished, so progress read **0/12 for the entire run and then 12/12**. Verified against the live
row while it was running: 0 committed at 195s, 12 at 243s.

The comment directly above that callback said *"Commits per dimension and beats the heartbeat
after each, so a death partway through loses one dimension, not twelve."* It had been there since
the worker was written and it was never true. A death at dimension 11 lost all eleven.

Three things followed, and only the first is cosmetic:

1. progress could never move
2. a mid-run death was total loss, not partial
3. a spinner and a countdown were both impossible, because the page **full-reloaded every 5
   seconds** — 429 KB × ~48 reloads ≈ **20 MB per run** — and any animation restarted each time

## Two bugs that the obvious fix would have exposed

**The spinner would have sat on the wrong row.** The screen marked the live dimension as
`rubricOrder[done]`. The scorer iterates `callOrder(pack)`, which groups dimensions by score enum
so same-enum calls share a warm prompt cache, and forces D12 last because its inputs are the other
dimensions' outcomes:

```
coaching  rubric: D1 D2 D3 D4 D5 D6 D7 D8 D9 D10 D11 D12
coaching  call:   D1 D2 D5 D3 D4 D6 D7 D8 D9 D11 D10 D12
kickoff   call:   D1 D2 D6 D8 D9 D3 D10 D4 D5 D7 D11 D12
```

Both diverge at the **third** call. It was invisible only because `done` was pinned at 0, so the
marker never left row 1. The moment dimensions started landing you would have had a scored row and
a spinning row several places apart. `currentDimensionId()` now takes the first id in call order
that has not been committed, and there is a unit test asserting
`currentDimensionId(COACHING_PACK, ["D1","D2"]) === "D5"` and explicitly `!== "D3"`.

**The deck's reduced-motion block would have turned the spinner into a strobe.** I said in
planning that `app/index.html` had no `prefers-reduced-motion` rule. It has two, and they are the
dangerous variant:

```css
*, *::before, *::after { animation-duration:.01ms !important; transition-duration:.01ms !important; }
```

That is the well-known snippet with its second half missing — it sets duration but **not
`animation-iteration-count: 1`**. An `infinite` animation under it does not stop. It completes
~100,000 cycles a second and is sampled once per frame, so the arc lands on an arbitrary angle
every frame: a strobe, delivered precisely to the people the media query exists to protect. Worse
than shipping no reduced-motion support at all.

`[data-spin]::after` (specificity 0,1,1) beats `*::after` (0,0,1) at equal `!important` weight, so
an explicit `animation:none!important` wins regardless of source order — which matters, because
`only()` injects at end-of-body while the deck's block is in `<head>`. There is a Playwright
assertion in a `reduced_motion="reduce"` context checking `animationName === 'none'`, because
nothing else can catch this.

## What the screen says now

- **Phases.** A run is 1 fact pass → 12 dimensions → 1 synthesis. The fact pass takes ~20–30s
  during which zero dimensions have landed — the same `0/12` as a run that has not started, and
  more than half the window that felt stuck. A `run_caps` row is the only durable thing separating
  them, so `execute()` now commits caps the moment the fact pass returns (they are final there —
  `computeTotal` reads caps, it never rewrites them). During the fact pass **no dimension row
  spins**; the spinner sits on a phase line, because spinning row 01 while row 01 is not being
  scored is a lie for exactly the 30s that matters.
- **The count stays `n / 12`** — it maps onto the twelve-dimension report. The **bar** spans all
  fourteen steps, so it cannot fill while the page still says it is scoring.
- **No score is shown mid-run.** Rows committed during the loop are pre-arithmetic: D-02
  redistribution promotes maxima and scales scores, and a non-recoverable cap floors D10 to 0. A
  number that later changes is the one thing this project does not print, and the progress screen
  had a score pill that no real run had ever reached — only the seed fixture had.

## The estimate, built so it cannot lie

`perDim = (heartbeatAt − startedAt) / done`, `remaining = (12 − done + 1) × perDim`. Two deliberate
over-estimates: `perDim` amortises the fact pass so it is worst at `done = 1` and tightens
monotonically, and synthesis is charged a full dimension. There is a unit test asserting the
overshoot is positive at `done=1`, positive at `done=6`, and **smaller at 6 than at 1** — the bias
encoded as a property so nobody later "improves" it into a trailing-window rate that can undershoot.

Before the first dimension lands there is **no number at all**, just `ESTIMATE ONCE THE FIRST
DIMENSION LANDS`. The ~20s/dimension figure from an earlier run was measured on a 9 KB transcript;
`coaching-02` is 65 KB. Displaying it would be an invented number, which is the failure this
codebase has already fixed twice.

The remaining figure is **never interpolated client-side**. It changes only when a dimension lands.
That is the structural guarantee: it cannot reach zero through time passing, only through evidence
arriving. Every lying countdown ever shipped was built by interpolating between polls.

**One countdown is allowed**, because it counts toward something that genuinely happens: past 60s
without a landing, the page says how many seconds remain before the stale sweep declares the run
dead and says why. That makes the never-a-forever-spinner promise visible rather than merely
honoured.

## Polling

`GET /api/runs/:id` already returned `{...contract, progress}` and measures **907 bytes** while
running. The rows are built once and thereafter only mutated — reassigning `innerHTML` per poll
would destroy the node the animation lives on and restart the keyframe, which is the original bug
at 1/100th the bandwidth. A terminal state does one `location.reload()`, so the finished report
still comes from `renderReport` rather than a second client-side renderer.

Three consecutive failed polls **stop the spinner** and say *"cannot reach the server … scoring is
unaffected, it runs on the server"*. A spinner still turning while the page has no idea what is
happening is the forbidden forever-spinner at the network layer. `console.warn`, never
`console.error`, because `app.py` fails the whole suite on any console error.

The client never decides a run is dead. The sweep is on read, so the next poll simply returns
`failed`. Two authorities on liveness would eventually disagree, on the one screen whose job is to
never be ambiguous.

---

# "Not evidenced" meant something other than what it said

Asked to score every `notEvidenced` dimension 0 and suppress its feedback, with an invitation to
push back. The data said no. All three flagged dimensions on that run **had evidence**:

| dim | score | verified quotes | what the flag actually meant |
|---|---|---|---|
| D3 | 5/15 | 2 | 1 of 4 required behaviours missing |
| D4 | 10/15 | **9** | 1 of 4 required behaviours missing |
| D10 | 0/5 | **5** | the booking contradiction, both sides quoted |

`notEvidenced` means *at least one required behaviour was looked for and not found*. Zeroing them
would take D4 from 10/15 to 0 **on nine verified quotes** and drop the total 65 → ~45: a false
negative, the same failure the system exists to prevent, pointed the other way. D10 was already
0/5, and its 0 rests on five quotes — suppressing its feedback would delete the single finding the
whole design was built to catch.

**The bug was the badge.** It read `NOT EVIDENCED`, which any reader takes as "no evidence". It now
reads `2 OF 5 NOT MET`, parsed out of the `absenceStatement` the contract already carried, with a
tooltip saying the rest of the dimension is still evidenced. The arithmetic did not change.

Where the instinct was right: a dimension with genuinely **zero** evidence is different —
`kickoff-02` D8 scored 0/10 with 7 of 7 behaviours unevidenced. Detected as `evidence.length === 0`
rather than from the flag.

---

# The PDF was losing its masthead entirely

The whole print stylesheet was five rules. The Download button did expand every `<details>` first,
so the content was there. The problem was that **`print-color-adjust` was set nowhere**, so
browsers strip background colours in print — and three elements are `background:#423A5E;
color:#fff`. On paper that is **white text on white**: the client name, "FULL ANALYSIS · COACHING
CALL · RUN #…" and "Coached by …" printed as nothing at all.

Print now has its own treatment rather than forcing backgrounds on (a reader can disable that, and
a full-bleed dark panel is a page of wasted ink): masthead in dark ink with a rule under it,
chips outlined instead of filled, single column, ~8pt labels and ~10.5pt body, band colour carried
as **text** colour which survives, and break control so headings do not orphan and quotes do not
split.

**A bug in my own print CSS, caught by checking rather than trusting.** The masthead rule listed
two selectors:

```css
body.qc-printing #3d [style*="background:#423A5E"],
body.qc-printing [id="3d"] [style*="background:#423A5E"]{ ... }
```

`#3d` is an **invalid CSS selector** — an id may not begin with a digit unless escaped — and one
invalid selector in a comma-separated list voids the **entire rule**. So the background stayed
`#423A5E` while the separate `… *{color:#131628}` rule worked, which is why the first check showed
dark text on a dark panel. Verified afterwards under `emulate_media(media="print")`, which is also
the mistake in the first check: `getComputedStyle` reads screen media unless print is emulated, so
the initial "still white" reading was measuring the wrong thing.

---

# Smaller things in the same pass

**Evidence line numbers are now controls.** Clicking `L005` on the report shows the transcript
around it — L002–L008 with the cited line highlighted — so a citation can be checked in place
instead of trusted. It is a **bounded** `GET /api/runs/:id/context?line=&radius=` window, clamped
to 6, and not an embed of the whole transcript: the run URL is shareable without a login, and
today it discloses the quotes the scorer cited. Shipping the entire call inside the HTML would
quietly upgrade every shared link from "the evidence" to "the whole conversation". Not in the PDF.

**`Evaluate another call`** beside Share and Download, and a hard ten-minute return to the landing
on every page — asked for explicitly, including the consequence that it also fires for a colleague
reading a link you shared. The one guard: the run form does not bounce while there is an unsent
transcript in the box, because silently binning someone's paste is not what "go back to the
landing" was asking for.

**Run numbers carry a `#`** everywhere they appear — progress hero, failure card, report masthead,
grade card, and the deck's own static copy.

**Report weight.** Every panel is built from one `CARD` constant, so section borders went 1px →
2px in one place. Coloured text — severity labels, cap determinations, score chips, the absence
badge — was 9–10px with no font-weight, so colour was doing all the work and thin colour read
washed out.

**The browser seed depicted an impossible state.** It committed `D1–D5` for a *kickoff* run, but
kickoff call order is `D1 D2 D6 D8 D9 D3 …`. No worker produces that set, so the fixture documented
something that cannot happen — and would have made the corrected live-row marker look broken when
it was right. Now a call-order prefix, with cap rows, plus a third seed for the fact-pass phase
which was previously unphotographable.

**Also corrected:** `app/api/runs/route.ts` claimed 300s "comfortably covers the measured ~240s".
That 243s was the *smallest* fixture at 9 KB; `coaching-02` is 65 KB over the same fourteen calls
and has never been timed. The comment now says the headroom above 9 KB is unmeasured, and notes
that per-dimension commits turn a kill from total loss into a partial one with an honest message.

**Counts:** 94 → **107** unit tests, 74 → **94** browser assertions. Most of the new ones are
negative — no provisional score, no invented estimate, no reload, no strobe under reduced motion —
because every one of them names a behaviour that shipped.
