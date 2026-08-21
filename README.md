# QC Evaluator — call quality scoring from a pasted transcript

Paste a coaching or kick-off call transcript, pick the rubric, get a 12-dimension scored report
with verbatim evidence for every claim, at a URL you can share.

**Live:** https://beavermind-qc-evaluator-three.vercel.app

Screens, in the order you walk through them, are in [`screenshots/`](screenshots/).

---

## What it does

| | |
|---|---|
| Scores | 12 dimensions per rubric, from the rubric's own words — never a paraphrase |
| Evidence | Every score carries verbatim transcript lines, verified against the transcript in code |
| Caps | `fired` / `not_fired` / **`indeterminate`** — with counter-evidence quoted |
| Output | A shareable URL that resolves without a login, plus a PDF |

Two rubrics are in scope: **coaching** and **kick-off**. Sales-call and strategic-review are
deliberately out — see [Cut deliberately](#cut-deliberately).

---

## Run it

```bash
npm install
cp .env.example .env.local        # fill in OpenRouter + Supabase
npx supabase db push              # applies supabase/migrations/
npm run build && npm start
```

| command | what it does | costs money |
|---|---|---|
| `npm test` | 107 unit tests — rubric arithmetic, evidence verification, transcript parsing | no |
| `npm run worker-check` | run lifecycle: idempotency, the four states, the stale-worker sweep | no |
| `npm run browser-seed` | seeds a fact-pass, a still-scoring and a dead run so every state is viewable | no |
| `npm run browser-test` | 96 Playwright assertions against a running build | no |
| `npm run screenshots` | writes `screenshots/` | no |
| `npm run report` | re-derives every citation from the transcript, then renders the page | no |
| `npm run evidence` | recomputes every determinism figure from the raw API responses | no |
| `npm run score -- coaching-01` | scores one fixture end to end | **yes, ~$0.64–0.80** |

`npm run report` is the important one. It exists because the report page once shipped three quotes
that were in no transcript at all, and fourteen line labels pointing at the wrong line.

---

## The four constraints, and how each is met

These come from the brief, not from preference.

**1. Every run has its own URL that still resolves next week, shareable without a login.**
The run id is a **uuid v4** and it is the entire capability. RLS is enabled on all five tables
with **zero policies**, so `anon` reads nothing; every read is served server-side by id. A
"public read by id" policy is in practice `select using (true)`, which makes the whole table
enumerable — the uuid protects one row, never the table. There is no endpoint anywhere that
lists runs. The landing page shows only the runs *your browser* started, from `localStorage`.

uuid **v4, not v7**: RFC 9562 §8 states v7 "MUST NOT be used as security capabilities" — it
embeds a creation timestamp and carries 48 fewer random bits.

**2. The operator can close the tab.**
`POST /api/runs` writes a row and returns an id without ever awaiting the model; scoring runs in
Next's `after()`, after the response has flushed. Each dimension is committed as it lands, so a
death partway through loses one dimension, not twelve.

**3. A failed run says why. Never a spinner that spins forever.**
Each committed dimension also beats a heartbeat. A `running` run with no beat for 120s is swept
to `worker_died` **on read** — Vercel Cron on Hobby runs at most once per day, so a scheduled
sweeper is not available; sweeping on read costs nothing and is exactly as timely as it needs to
be, since nobody learns a run is dead until they look. The message states how many dimensions
had landed and how long ago. Re-pasting the transcript re-runs that same id rather than
stranding it.

**4. Evidence or nothing.**
Absent behaviour is *stated*, never inferred from mood. `scripts/validate-report.ts` independently
re-derives every citation and is the gate on the report page.

---

## Five decisions worth explaining

Each reverses an obvious instinct.

**The quote is the key; the line number is a hint.** Models get prepended line numbers wrong
routinely, and one off-by-one floors a dimension that was fine — a false negative *in the
direction that looks like diligence*. So the normalised quote is searched across the whole
transcript, mapped back to the original span, and the line derived in code. Minimum 8 words:
8-word quotes are 99.7–100% unique per transcript, 3-word only 87–94%.

**The provider is pinned.** `anthropic/claude-opus-5` is served by **nine endpoints** on
OpenRouter. Three don't support `structured_outputs` — the score enum silently degrades to a
hint. Unpinned, the determinism claim is indefensible. Every call carries
`provider:{only:["anthropic"],allow_fallbacks:false,require_parameters:true}`.

**The score is emitted after the evidence, not before it.** The output schema is ordered
`requirement_findings[] → reasoning → score → quick_fix`, and each finding carries its own
`evidence[]` and `counter_evidence[]`. Property order *is* generation order under constrained
decoding, so a score emitted first is one the evidence then rationalises — and the JSON still
validates either way, which is what makes this easy to get wrong silently.

**Every cap is an enumeration, never a negative.** Not *"were there no follow-up questions?"* but
*"list EVERY follow-up question with evidence; empty array if none."* Code computes
`absent := verified.length === 0`. A network blip that returns nothing is then a *failure*, not a
finding — "we did not look" is never "it is not there".

**Talk-share caps are phrased in TIME; only words are measurable.** No transcript has timestamps.
`kickoff-02` is 73.1% by word — which trips a >70% cap — but 69.4–75.1% by *time* across a
plausible speaking-rate ratio. The verdict flips on an assumption nobody stated, so the report
publishes the interval and the tie-break rule: a cap fires only if the **whole** interval exceeds
the threshold; a straddle is `indeterminate` and **not applied**. A penalty that cannot be
established is not applied.

`temperature` does not exist on current Claude models. Determinism here is engineered — fixed
enums, arithmetic in code, evidence gating, content-hash idempotency — never a sampling knob.

---

## What was measured

Every figure here is recomputed from the raw API responses by **`npm run evidence`**, which prints
the source file beside each number and exits non-zero if any of them stops matching. The responses
themselves are committed in `probes/out/` and `eval/out/` — a number nobody can check is a claim,
not evidence.

**57 repeated measurements, split by model, because 25 of them are about a model that is not in
this product:**

| | n | what it establishes |
|---|---|---|
| M3 — enum, adversarially prompted | 20 | the score enum is a hard constraint |
| M5 — the booking contradiction | 10 | the hardest case, same answer every time |
| full end-to-end runs | 2 | whole-pipeline stability |
| **Opus subtotal — the system that ships** | **32** | |
| Sonnet enum gate | 20 | why Sonnet was rejected |
| Sonnet trap gate | 5 | why Sonnet was rejected |
| **Sonnet subtotal** | **25** | |

Merging those into one "57 tests" would claim 78% more about the shipped system than was measured.

**The results:**

| | |
|---|---|
| enum: emitted the demanded illegal `7` | **0 / 20** |
| enum: emitted the same legal value | **20 / 20** |
| the trap: `indeterminate`, both lines quoted | **10 / 10** |
| the trap: said the call was booked | **0 / 10** |
| two full runs: dimensions identical | **11 / 12** |
| two full runs: caps identical | **6 / 6** |
| fabricated quotes, all runs | **0** |

**And the weak number, stated rather than buried.** Thirty of those 32 test one question at a
time. Only **two** run all twelve dimensions end to end, so the whole-pipeline figure is a sample.
A real one needs roughly 5 reruns × 4 transcripts ≈ $24 against a $10 budget. The one dimension
that moved is **D12** — the only dimension carrying a criterion no transcript can settle, since
there are zero timestamps in any of them. The instrument is weakest exactly where the wobble is.

`probes/RESULTS.md` says this about its own best result, and said it before the result was used
anywhere:

> *"10/10 is a strong result but it is one dimension on one transcript. It is not a determinism
> claim for the whole system, and it must not be reported as one."*

---

## The adversarial case

`coaching-01` is a warm, likeable call. At **L188** the client says *"Wednesday the 10th at
four… Let's lock that in."* Five lines later at **L193** the coach says *"I'll get you those
times soon so we can get this locked on the calendar."*

They contradict. Coaching D10 is **0/5 non-recoverable** if the next call was not booked live. A
system that guesses scores it 5/5 and moves on.

This one reports `indeterminate`, quotes **both** lines, and names the branch it scored — in
10/10 probe runs and in every full scoring run. That single requirement is why caps have three
states and why the report layout has to hold a contradiction.

The committed artifact [`eval/out/coaching-01.json`](eval/out/coaching-01.json) is that run:
**100/105 raw → 95/100 ELITE**, 127 citations, zero fabricated, booking cap `indeterminate`.

Measurements — determinism, the trap, cost, and why Opus rather than the 2.5×-cheaper Sonnet —
are in **[`eval/REPORT.md`](eval/REPORT.md)**, including what was *not* measured and why.

---

## Layout

| | |
|---|---|
| `lib/rubric/` | Compiled rubric packs. Criteria strings are verbatim from the source tables. |
| `lib/transcript/` | Canonicalise, parse, talk-share. The form and the scorer share this exact code. |
| `lib/scoring/` | Prompts, the fact pass, evidence verification, arithmetic. |
| `lib/report/` | The render contract, the icons, and the layer that serves the design as the app. |
| `app/` | Route handlers. They return HTML, not React pages. |
| `supabase/migrations/` | Full schema. Decisions are documented in the DDL. |
| `eval/`, `probes/` | Measurement harnesses and their recorded results. |
| `DECISIONS.md` | The decisions log: every choice, every bug found, and what caused it. |
| `CLAUDE.md` | The constraints and the eight corrections, derived from a 13-agent research pass. |
| `HANDOFF-BACKEND.md` | The orchestrator's brief to the implementer: probes, schema, pipeline order, and which decisions were closed before coding started. |
| `wireframes/` | Where the interface started, before the design deck the app now serves. |

`app/index.html` is the design deck served directly, with one screen revealed per route — so the
report a visitor sees and the report `npm run render` produces are the same code path, and
`npm run validate` checks the thing that actually ships.

---

## Cut deliberately

Auth (it breaks the shareable-URL constraint outright) · coach and client directories ·
the sales-call and strategic-review rubrics · retrieval and embeddings — rejected on
correctness, since a reranker would surface `L188` and bury `L193`, which is precisely the
failure the whole design exists to prevent · a calibration layer, because no human-scored ground
truth exists to calibrate against.

---

## Notes

The four transcripts and two rubrics under `fixtures/` are copies of the exercise material,
committed so the tests and the recorded measurements are reproducible from this repo alone.
Nothing here reads or modifies the original exercise repository.
