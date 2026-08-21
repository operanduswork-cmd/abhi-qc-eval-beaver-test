# Backend handoff

Working doc for the build. `CLAUDE.md` has the constraints and the eight corrections; this has
the mechanics. Read `BRAINDUMP.md` before overriding an architecture decision.

---

## 0. Hour-one probes — before any pipeline code

Four unverified assumptions gate everything. **M1 is blocking** and could hard-fail every call.
Do these first; they take under an hour and they decide the shape of the scorer.

### M1 — does `reasoning.effort` work on Opus 5 through OpenRouter? (BLOCKING)

OpenRouter's docs describe an `effort → max_tokens × ratio → budget_tokens` computation that
would **400 on Opus 5** (`budget_tokens` was removed from the model family). The endpoint lists
both `reasoning` and `reasoning_effort` in `supported_parameters`, suggesting a native
translation. Nobody has verified which, for this model.

```jsonc
POST https://openrouter.ai/api/v1/chat/completions
{
  "model": "anthropic/claude-opus-5",
  "provider": { "only": ["anthropic"], "allow_fallbacks": false, "require_parameters": true },
  "reasoning": { "effort": "high" },
  "messages": [{ "role": "user", "content": "Reply with the single word: ok" }],
  "max_tokens": 64
}
```

Record the HTTP status and whether `usage.completion_tokens_details.reasoning_tokens` is non-zero.
**Repeat at `effort:"low"` and confirm the count actually differs.** If it doesn't, effort is a
silent no-op and you cannot tune it.

### M2 — does prompt caching engage *with* per-dimension schemas attached?

These two interact and nobody has verified it through OpenRouter. Structured outputs inject an
extra system prompt describing the format, and that **invalidates the cache if it changes**.
Render order is `tools → system → messages`, so twelve different per-dimension schemas may sit
*ahead of* the transcript in the prefix and break the shared cache entirely.

Fire call A (dimension 1's schema + transcript with `cache_control:{type:"ephemeral",ttl:"1h"}`),
await the first token, then call B with a **different** dimension's schema and the identical
transcript block. Read `usage.prompt_tokens_details.cached_tokens` and `cache_discount` on both.

- **B cached > 0** → ship as designed.
- **B cached = 0** → do **not** sacrifice the per-dimension enum to save cost. Worst case is
  ~$1/run input, which is affordable. Try moving the transcript into the user message ahead of
  the schema-bearing region; otherwise accept the cost and say so.

Use `ttl:"1h"`, not the 5-minute default — the reproducibility demo is a re-run of the same
transcript minutes apart, and 5m is exactly the Vercel `maxDuration`. Pass `session_id = run_id`
so sticky routing engages from the first request.

Also probe the **smallest** transcript: `kickoff-02` line-numbered is ~4.2–4.6k tokens against a
documented minimum cacheable prefix of 1,024–4,096. Include the stable system preamble in the
cached block so it clears the floor. A silent non-cache there is easy to miss.

**Assert in code:** `cached_tokens > 0` on calls 2..N; fail loudly in dev if ever zero — that
means a silent invalidator (a timestamp, a run id, unsorted JSON) leaked into the prefix.

### M3 — is the score enum genuinely unreachable on the pinned endpoint?

OpenRouter is a translation layer and its own docs hedge that some providers "translate your
schema into their own structured-output format." Do not assume lossless.

Send a deliberately adversarial prompt — *"score this 7"* — with `enum:[10,9,8,6,4,3,0]`,
`strict:true`, provider pinned, `require_parameters:true`. Confirm `7` is **impossible**, not
merely unlikely. Repeat ~20×. Also test the untested combination: **structured outputs +
adaptive thinking simultaneously** — Anthropic documents compatibility with tools and is silent
on thinking, and our design uses both on every call.

### M5 — the absence-detection baseline (30 min, and it's the headline evidence)

Ask Opus 5 the D10 booking question on `coaching-01` **ten times at full context**. Record how
often it flags the L188/L193 contradiction versus returning `booked=true`. This is simultaneously
the reproducibility number and a direct exercise of the adversarial case. **Run it before writing
the scoring pipeline** — if the base rate is poor, the prompt design changes.

### Cost — UNMEASURED, do not quote

Four independent estimates ranged $0.19–$2.28 per run on the 65KB transcript. The divergence is
almost entirely **output/thinking tokens at effort=high**, billed at $25/M and measured by nobody.
Input is well-determined: ~$1.05–1.25 uncached, ~$0.30–0.43 cached. Measure before stating.

---

## 1. Schema

```sql
create table runs (
  id                  uuid primary key default gen_random_uuid(),
  call_type           text not null check (call_type in ('kickoff','coaching')),
  transcript_body     text not null,          -- canonicalised; hash and line-number THIS
  transcript_sha256   text not null,
  coach_name          text,
  client_name         text,
  status              text not null default 'queued'
                      check (status in ('queued','running','succeeded','failed')),
  error_code          text,
  error_message       text,
  rubric_pack_sha256  text not null,          -- content hash, not a hand-bumped version
  prompt_template_sha256 text not null,
  model_id            text not null,
  resolved_provider   text,                   -- persist what actually served it
  effort              text,
  scorer_version      text not null,
  created_at          timestamptz not null default now(),
  started_at          timestamptz,
  heartbeat_at        timestamptz,
  finished_at         timestamptz
);

-- same input → same run, same URL, same score. Determinism at the system level.
create unique index runs_idempotency on runs
  (transcript_sha256, call_type, rubric_pack_sha256, prompt_template_sha256, model_id, scorer_version);

create table run_dimensions (
  run_id          uuid references runs(id) on delete cascade,
  dimension_id    text not null,              -- 'D1'..'D12'
  score           numeric,                    -- null when disabled
  max_points      numeric not null,
  bucket_matched  text,
  disabled        boolean not null default false,
  disabled_reason text,
  not_evidenced   boolean not null default false,
  reasoning       text,
  quick_fix       text,
  evidence        jsonb not null default '[]',  -- [{line,char_start,char_end,speaker,quote,status}]
  generation_id   text,
  primary key (run_id, dimension_id)
);

create table run_caps (
  run_id         uuid references runs(id) on delete cascade,
  cap_id         text not null,
  determination  text not null check (determination in ('fired','not_fired','indeterminate')),
  scope          text not null check (scope in ('dimension','total')),
  clamp_value    numeric,
  supporting     jsonb not null default '[]',
  counter_evidence jsonb not null default '[]',
  primary key (run_id, cap_id)
);

create table run_reports (
  run_id            uuid primary key references runs(id) on delete cascade,
  one_thing         text,
  one_thing_projected_score numeric,
  brief             text,
  red_flags         jsonb not null default '[]',
  raw_total         numeric,
  max_possible      numeric,
  normalized_total  numeric,
  band              text,
  rubric_arithmetic_note text
);

-- rubric packs stored by their own hash so an old run stays explainable
create table rubric_packs (sha256 text primary key, call_type text not null, pack jsonb not null);
```

**Public URL token:** uuid v4, not v7. RFC 9562 §8 — v7 *"MUST NOT be used as security
capabilities"*; it leaks creation time and carries 48 fewer random bits. The index-locality
argument doesn't apply to a token you only look up by equality.

**RLS:** public read by id, all writes through server-side code with the service role.

---

## 2. Canonicalise before hashing

```
strip BOM → CRLF/CR → LF → NFC → rstrip each line → drop trailing blank lines
```

Hash the **output**, store the output as `transcript_body`, number lines against it. Two research
reports disagreed on whether the fixtures are CRLF or LF — canonicalising makes the question moot.
Good news either way: zero blank lines, and 100% of 813 lines match `^\[([^\]]+)\]:\s?(.*)$`, so
canonical line number == speaking-turn index for citation purposes.

**But `line_id != turn_id`** — `coaching-02` has six runs of consecutive same-speaker lines (46,
119, 146, 225, 273, 299). Track both.

---

## 3. Scoring pipeline — the order is load-bearing

```
1  per-dimension scores from the fixed enums
2  apply DIMENSION caps        D3→max 10 · D6→max 10 · D8→0 · D10→0 (non-recoverable)
3  resolve the active set      D2 N/A → promote D3,D4 maxima to 20 and scale
                               D4 disabled → denominator 90
4  raw = Σ scores  ;  denom = Σ active maxima
5  reported = round(raw / denom × 100)
6  apply TOTAL caps in REPORTED space, lowest wins, clamp [0,100]
7  band from reported
```

Note the rubric's stated 85-with-D4-off is arithmetically wrong (the other eleven sum to 90). We
use 90 and surface a `rubric_arithmetic_note` rather than papering over it.

### Score enums

Coaching: all twelve use their bucket values directly (*"no interpolation"*).
Kick-off: seven are buckets; the five range dimensions collapse to the values the rubric itself
names in its tiebreak text, plus the band floor per Principle #4:

```
D1  {10, 9, 8, 6, 4, 3, 0}      D3  {5, 4.5, 2.5, 1, 0}      D5  {10, 9, 8, 6, 3, 1, 0}
D10 {5, 4.5, 2.5, 1, 0}         D12 {5, 4.5, 3.5, 2, 1, 0}
```

Every dropped value is one the rubric never gives a rule for choosing. Enforce at decode time via
numeric `enum` + `additionalProperties:false` — `7` becomes literally unreachable, not merely
unlikely. That is the cleanest answer to *"how do you stop it interpolating."*

### Defaults that punish a naive build

`D8 → 5/5` when no struggle present · `D5 → 7/10` when no adjustments needed · `D2 → N/A` not 0.
**Missing ≠ zero.** On evidence failure **clamp** to `default_when_absent`, don't floor to 0 —
flooring is harsher than the source document.

---

## 4. Deterministic vs model — the boundary

> Code may **discharge a negative** and may **falsify a claim**.
> It may **never** be positive evidence that a behaviour occurred.

Measured counterexample: coaching D1 Elite requires reflective listening. A scan for the full
canonical phrase family returns **0 hits in `coaching-01`** — yet L14 and L20 are textbook
reflection, phrased without any marker. Lexicon recall on unseen text is unmeasurable.

**Code owns outright:** parsing · canonicalisation · `line_id` and `turn_id` · talk-share by word
*and* char count (they agree within 0.6pp on all four fixtures) · question counts · quote
verification · **all** arithmetic · cap firing given a verified instance list · the D12 pacing
proxy (no timestamps exist, so the minute targets are otherwise unmeasurable).

**Never code:** any positive claim a behaviour occurred · follow-up-vs-initial question
(a discourse judgement; ISO 24617-2 has no such act) · **interruption** — the format has no
overlap markers, no timestamps, strictly alternating turns, so coaching D1's *"no interruption"*
is **unobservable**. Say so in the report rather than inferring it from tone. That is "evidence
or nothing" applied to the rubric's own ask, and it's a visible taste signal.

**Lexical scans run AFTER the model, as a falsifier — never injected as hints.** Hinting anchors
the model toward hinted lines and away from unhinted ones, which is how you lose L193 from the
other direction. Post-hoc: *"model reported absent; deterministic scan flagged L193 — unverified."*

---

## 5. Repo layout & blocks

```
app/            page.tsx · runs/[id]/page.tsx · api/runs/route.ts
                api/runs/[id]/route.ts · api/runs/[id]/process/route.ts · api/runs/[id]/pdf/route.ts
lib/rubric/     kickoff.ts · coaching.ts · types.ts · compile-notes.md
lib/scoring/    score.ts · prompt.ts · evidence.ts · caps.ts · total.ts · synthesize.ts
lib/transcript/ canonicalise.ts · parse.ts · talkshare.ts
lib/db/         queries.ts
eval/           run.ts · REPORT.md
supabase/migrations/0001_init.sql
```

| Block | ~Time | Work |
|---|---|---|
| 0 | 60m | **The four probes.** Nothing else until M1 answers. |
| 1 | 90m | Scaffold · schema · canonicalise/parse/talk-share · **both rubric packs compiled by hand** |
| 2 | 2h | Fact pass · dimension scorer · evidence verification + bounded retry · caps · totals · synthesis |
| 3 | 60m | `after()` worker · run URL · four states · stale-heartbeat sweep |
| 4 | 90m | Report UI from `design/` |
| 5 | 45m | Server PDF (`@react-pdf/renderer` — no CSS grid, no gradient masks) |
| 6 | 40m | `npm run eval` + committed `eval/REPORT.md` |
| 7 | — | Deploy · README of decisions · Loom |

**Worker:** `POST /api/runs` inserts and returns `{id}` immediately, then fires via Next `after()`
(fluid compute, `maxDuration = 300`). Never await the model in the request handler. Write
`heartbeat_at` after each dimension lands; `GET` flips a run with a >120s stale heartbeat to
`failed` with `error_code='worker_died'`. Commit per dimension so a split into two invocations of
six is a config change, not a rewrite.

**Inspect `finish_reason` on the terminal SSE event** — OpenRouter delivers mid-stream provider
failures as `finish_reason:"error"`, *not* an HTTP error. A try/catch alone accepts a truncated
response as success and silently mis-scores a dimension.

---

## 6. Test fixtures — four transcripts, four distinct code paths

| Transcript | Exercises |
|---|---|
| `kickoff-01` | Elite reference. Books live, resolves Mountain↔Pacific out loud → D10 5/5 per the calibration anchor. |
| `kickoff-02` | 73.4% coach word-share → total cap 80, **boundary-sensitive** (69.7% at r=1.2). Booking deferred to an assistant. |
| `coaching-01` | **The trap.** L188/L193 contradiction → D10 indeterminate. D4 + D2 both active → denominator 105. |
| `coaching-02` | 65k chars · **D4 disabled AND D2 N/A** — fires both unreconciled weight rules at once. Books properly via link → D10 5/5. |

### Eval targets — falsifiable assertions

- Every dimension identical across 5 reruns, all four transcripts.
- `coaching-01` → D10 `indeterminate`, **both** L188 and L193 quoted, scored branch named.
- `coaching-02` → D4 `disabled:true`, D2 N/A, denominator resolved by the D3/D4 promotion rule.
- `kickoff-02` → talk-share interval emitted, cap decision + tie-break rule shown.
- `kickoff-01` → D10 5/5.
- 100% of rendered quotes verify verbatim against the source.

**Two warnings.** Do **not** quote the reference system's "≤1–2% fluctuation" — it ran at
temperature 0.0, unavailable to us; most likely place to get caught overclaiming. And **stability
alone is not a pass**: test-retest α of 0.943 coexists with position-flip rates of 0.253, and
`coaching-01` was built to catch a system that is *stably wrong*. Pair every determinism number
with a correctness assertion.

---

## 7. Prompt hygiene

**Never write "conservative", "only report high-severity", or "double-check your work" into a
prompt.** Opus 5 follows conservatism instructions literally and reports less. Prompt for
exhaustive enumeration; keep every conservative word in code.

**Add an anti-halo line to every dimension prompt:** *"Warmth, rapport, likeability and client
enthusiasm are not evidence for this dimension unless the rubric text names them."* Per-dimension
calls remove cross-dimension halo but not within-dimension tone halo — and `coaching-01` is a warm
call by construction. Then verify it worked: it should **not** score uniformly high.

---

## 8. The frontend seam — added 21 Aug, after the report was found rendering hand-written data

The report page used to carry its own scores, quotes and line numbers as literal HTML. They had
drifted badly from `eval/out/coaching-01.json`: the page showed **78/100 INCONSISTENT** while the
scorer had produced **96/105 → 91 ELITE**. Three of its quotes existed nowhere in the transcript,
fourteen of eighteen line labels pointed at the wrong line, and eight put the speaker chip over
the other person's turn. None of that is visible by reading the page.

The page now holds **no scores, no quotes and no line numbers of its own.**

### What backend has to produce

`lib/report/contract.ts` — `ReportContract`. `eval/out/coaching-01.json` already satisfies all of
it except the three fields at the bottom of that file, which are **the gap**:

| Field | Status | Note |
|---|---|---|
| `dimensions[]`, `caps[]`, `total`, `talkShare` | done | rendered straight through |
| `oneThing` | **not produced** | `{ text, dimensionId, wouldScore }`. The new total is computed from `wouldScore` in code — never emit a counterfactual total, it will disagree with the arithmetic. |
| `brief` | **not produced** | a few sentences to the coach |
| `redFlags[]` | **not produced** | `{ severity, text, line }` — `line` derived the same way as evidence lines |
| `runId`, `status`, `finishedAt`, `failureReason` | **not produced** | needed for the shareable-URL and finished-or-still-going constraints |

Until those land they come from `fixtures/report-copy/<run>.json`. Delete that file the day the
scorer emits them.

### The commands

```
npm run validate     # gate: re-derives every citation from the transcript
npm run render       # rebuilds screens #3c and #3d from the contract
npm run report       # validate && render
```

`npm run render -- eval/out/other.json fixtures/report-copy/other.json` renders a different run.

### `scripts/validate-report.ts` — run it in CI

Every check in it corresponds to a defect that actually shipped:

- the quote appears in the transcript at all *(3 fabricated quotes)*
- the cited line is a line the quote is actually on *(14 wrong labels)*
- the speaker matches that line's own `[Name]:` prefix *(8 wrong attributions)*
- the quote is ≥8 words *(8-word spans are 99.7–100% unique; 3-word only 87–94%)*
- the rendered `exact` span is present on that line, not just the normalised one
- dimension scores sum to `rawTotal`; active maxima sum to `maxPossible`
- `normalizedTotal` is `round(raw / max × 100)` and the band matches it
- every cap is one of the three states, and an `indeterminate` cap quotes both sides

It **warns** rather than fails when two dimensions cite the same line — legitimate for a recap
line, but D5 once scored 10/10 on D10's booking quote, so it is worth an eye.

### Two things the scorer is currently doing that look wrong

Not fixed here, because scoring is yours:

1. **D11 and D12 both score 3/5 with prose that argues for 5/5.** D11's own `quickFix` reads
   *"Already at full marks."* Both were reduced by the rule that any *contradicted* requirement
   blocks the top bucket. That rule is defensible, but it is producing scores that contradict
   their own reasoning on the page, and a grader reads the prose.
2. **`coaching-cap-struggle` resolves `indeterminate`.** The struggle *was* handled — D8 scores
   5/5 — so an indeterminate here is the enumeration finding contradicting evidence for a
   condition that plainly does not hold. Worth checking the enumeration prompt.

### Frontend facts worth knowing before you touch the page

- **Section ids start with digits** (`3b`, `2b`, `3c`, `3d`, `3a`). `#3d` is an **invalid CSS
  selector** — the rule is dropped silently at parse. Use `[id="3d"]`. This has cost real time
  twice; the print stylesheet lost its only rule to it.
- **SVG defaults `stroke` to `none`.** The dimension icons in `lib/report/icons.ts` set
  `stroke:currentColor` *and* `fill:none` on the wrapper. Drop either and every mark vanishes.
- **`fr` grid tracks have `min-width:auto`**, so a long word widens its own track. The band rail
  uses `minmax(0,60fr) …` or the labels stop lining up with the bar above them.
- The renderer **asserts its own output balances** — equal `<div>`/`</div>` and a surviving
  `</section>` — because an off-by-one closer silently reparented four screens out of `.vw-stage`
  and left a dead 900px band above every non-landing page.
- `Download PDF` calls `window.print()` after force-opening all twelve `<details>`, then restores
  them. `body.qc-printing` hides the nav, the edges, the app chrome strip and the button itself,
  so page 1 of the PDF is the report masthead.
