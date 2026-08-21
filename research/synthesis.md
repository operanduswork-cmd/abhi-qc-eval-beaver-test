# BeaverMind Stage-2 — Research Synthesis → Plan Deltas

**Read this first — three factual corrections to the brief itself, before any code hardcodes them:**

1. **The coaching-01 contradiction is at L188 and L193, not L192/L197.** Two independent reads of the file confirm L188 `[Malik Osei]: Wednesday the 10th at four, yeah, I'm off that day, that one works. Let's lock that in.` and L193 `[Priya Raman]: ...I'll get you those times soon so we can get this locked on the calendar.` The "five lines later" detail is right; the absolute numbers are off by four.
2. **The two talk-share caps are different caps with different numbers.** Coaching: `coach speaks >75% → max 75 total`. Kick-off: `coach speaks >70% without client engagement → max 80 total`. The brief's summary merged them. Do not merge them in the rubric pack.
3. **Line-ending format is disputed between reports.** One measured CRLF on all four fixtures; another measured "no CR bytes, LF-only." One of them is wrong. It does not matter *if* you canonicalise before hashing and before line-numbering — which you must do anyway. Do not resolve the dispute; make it irrelevant. (See ADOPT #12.)

---

## 1. VERDICT ON THE TWO QUESTIONS

### (a) How far can deterministic code replace the model?

**Further than the plan currently uses it, but the boundary is a *direction*, not a *dimension list*.** The operative rule, and the one sentence to say on camera:

> Lexical/statistical code may **discharge a negative** and may **falsify a claim**. It may **never** be positive evidence that a behaviour occurred.

The reason is a measured counterexample from this corpus: coaching D1 Elite requires reflective listening ("What I'm hearing is…"). A scan for the full canonical phrase family returns **0 hits in coaching-01** — yet L14 and L20 are textbook reflection, phrased without any canonical marker. Recall of a hand-built lexicon on an unseen transcript is unmeasured and unmeasurable. In the other direction it is sound: finding *any* verified instance decisively disproves a universal negative.

**Code fully owns (no model involvement at all):**

| Owned deterministically | Why it's safe |
|---|---|
| Parsing, canonicalisation, `line_id` **and** `turn_id` (they differ — coaching-02 has 6 consecutive same-speaker lines at 46, 119, 146, 225, 273, 299) | Pure format |
| Talk-share by **word count and char count**, cross-checked | Measured agreement within 0.6pp across all four files |
| Engagement profile: substantive-turn rate (≥25w), backchannel rate | Separates kickoff-02 (11.3% / 8.1%) from the rest (29.6–52.8% / 0.6–2.0%) by a wide margin |
| Question counts per speaker | Only used to discharge the negative cap |
| Quote verification (normalised substring over the whole transcript) | Exact-match, no threshold to defend |
| **All arithmetic**: summing, dimension caps, active-set resolution, normalisation, total caps, banding, the "what would it have scored" projection | The model never sees a total |
| Cap *firing*, given a verified instance list: `fired = verified_instances.length === 0` | Turns an unverifiable negative into a countable positive |
| Cross-dimension entailment assertions | Transcribed from sentences the rubric already contains |
| D12 pacing proxy (words/turns per SOP section) | Transcripts have **no timestamps**; D12's minute targets are otherwise literally unmeasurable |
| Post-hoc lexical falsification of the model's negative claims | Cannot prove absence; can prove presence |

**Code cannot own, and must not be allowed to influence a score:**

- Any positive claim that a behaviour occurred (the reflection counterexample).
- Follow-up vs. initial question. ISO 24617-2 defines 56 dialogue-act functions and has no "follow-up question" among them — it is a discourse-relation judgement. Define it *operationally* in the rubric pack ("a coach question in turn N whose content references the client's turn N−1"), hand the model the adjacency pairs, let it judge, and say on camera that this was a boundary you drew deliberately.
- **Interruption.** Coaching D1 Elite requires "Listens before responding — no interruption." The format has no overlap markers, no timestamps, and strictly alternating turns. It is **unobservable**. The only mechanical signal is the turn-final em dash (kickoff-02: client 9/62 turns vs. coach 0/64; every other file 1–2, i.e. baseline noise). Ship it as a labelled *trail-off/cut-off proxy*, never as an interruption verdict, and have the report **say** the criterion is unobservable in this format. That is "evidence or nothing" applied to a criterion the rubric itself asks for, and it is a visible taste signal.
- Whether L188/L193 constitute a contradiction. Code can build the ordered timeline (`proposed → completed → deferred`) and flag `deferred post-dates completed`; the *adjudication* is a two-sentence pairwise question, which is where LLMs are strong.
- Anything the rubric words as depth, quality, or "did it land."

**Honest scope caveat:** one report mapped all 24 dimensions into "4 substantially pre-computable / 8 evidence-bundle+judgement / 12 irreducible," but flagged that mapping *medium confidence* — it read the caps blocks and D1–D3 in full and only the headings for D4–D12. **Re-check that mapping against each dimension's actual bucket criteria before building the `precompute` field.** Do not treat it as done work.

### (b) Do Gemini embeddings / Cohere rerank / any retrieval layer belong here?

**No. Not "unnecessary" — unsound for the highest-stakes part of the scoring.** Four independent reasons, ordered by strength:

1. **Soundness, not model quality.** The caps are universally-quantified negatives ("No follow-up questions **anywhere** in the call", "No connection to long-term vision **at any point**"). Top-k retrieval is open-world: an empty result set means *not surfaced*, not *not present*. Recall@k is an estimate over labelled relevance, never a coverage guarantee. You cannot establish a negative from a sample. This is a logic argument and it does not depend on any benchmark.
2. **The adversarial case is a contradiction-retrieval problem, and dense retrieval is structurally worst at exactly that.** Ask "was the next call booked?" — L188 ("Wednesday the 10th at four… Let's lock that in") is the *high*-similarity passage; L193 ("I'll get you those times soon") is the *decisive* one and is semantically vaguer. A reranker ranks the decisive line **lower**. Retrieval would actively cause the D10 failure the transcript exists to catch. (SparseCL: similarity search "struggles to capture the essence of contradiction due to its inherent nature of favoring similarity.")
3. **Measured negation performance is below random.** NevIR pairwise accuracy, random baseline 25%: `text-embedding-3-large` 22.6%, RepLlama 13.0%. Cross-encoder rerankers are mediocre (bge-reranker-v2-m3 43.5%). Only *LLM listwise* rerankers do well — which is just an LLM reading the text, i.e. not retrieval.
4. **It adds nondeterminism to a product graded on determinism.** Reranker scores are not batch-invariant; identical inputs yield different scores under different concurrent load, so the top-N cut — and therefore the lines the model sees — can differ between runs. This is fatal to the last pro-retrieval argument (that the reranker is "the deterministic part").

Two secondary points worth having ready: `gemini-embedding-2` caps input at **8,192 tokens**, so embedding the 15.4k-token transcript would *reintroduce the chunking the plan correctly forbids*; and the assignment's most plausible-sounding use case — clustering sections to SOP phases — **inverts coaching D12's calibration**, which explicitly scores woven, unannounced transitions as ELITE and "Okay, now I'm in the check-in section" as MID. Lexically explicit section markers are precisely what embeds most cleanly, so a phase classifier rewards the behaviour the rubric penalises.

**What the instinct was actually reaching for, and what solves it:**

| The intuition | What it really was | The correct solution |
|---|---|---|
| "12 × 16k tokens is wasteful, narrow the input" | A **cost** problem | **Prompt caching.** ~$1.05–1.25 of input per run → ~$0.30–0.43. Lossless — the model sees byte-identical input either way. |
| "Make sure the model doesn't miss the one decisive line" | An **attention/recall** problem | Whole transcript + **enumeration-shaped schemas** + a **post-hoc deterministic falsifier**. Not a smaller input. |
| "I want a deterministic component I can point at" | A **defensibility** problem | The deterministic layer above (talk-share, engagement, quote verification, all arithmetic, the entailment table) — none of which is retrieval. |

**Honest counter-evidence, pre-empted rather than hidden:** SummHay found long-context LLMs score <20% Joint Score where RAG does substantially better. It does not transfer — its haystacks are ~100 documents / ~100k tokens and the retrieval unit is document-selection within a corpus. You have one 16k-token document and no corpus. Say that on camera before the grader says it for you. And say the scope caveat: if this later scores thousands of past calls, or transcripts pass ~100k tokens, the calculus changes. A reasoned no beats a reflexive one.

---

## 2. PLAN CHANGES — ADOPT

Tiered, because you have four days. **P0** = correctness or a hard constraint, cheap. **P1** = strongly graded, moderate. **P2** = do only if P0/P1 are done.

### Against plan item 1 (rubric packs)

**1. [P0] Add three fields per dimension: `precompute: string[]`, `unobservable: string[]`, `evidence_default_when_absent`.** `unobservable` is load-bearing: coaching D1 must carry `['no interruption']` and the report must say so rather than infer politeness from tone.

**2. [P0] Put every deterministic threshold *inside the versioned pack*, not in code constants** — the 25-word substantive cutoff, the backchannel word list, the ±3-turn proximity window, the r=0.8..1.2 speaking-rate sensitivity range, lexical family definitions. "Scores the same transcript the same way twice" has to cover the deterministic half too.

**3. [P0] SHA-256 the compiled pack and the prompt template; store `rubric_pack_sha256`, `prompt_template_sha256`, `model_id`, `effort`, `scorer_version` on every run row, and store the pack JSON itself in a `rubric_packs` table keyed by its own hash.** Otherwise "the URL still resolves next week" resolves to a report you can no longer explain. A hand-bumped `v3` is a promise a human has to keep; a content hash is a fact. (Rubric locking ablates at −4% QWK in the closest published analogue.)

**4. [P1] Give coaching D12 an explicitly documented pacing proxy** (share of turns and words per SOP section) since the rubric's minute targets are unmeasurable without timestamps. Otherwise D12 is scored on vibes.

### Against plan item 2 (quantized score enums)

**5. [P0] Enforce the enum at decode time, not by retry.** Anthropic structured outputs are true constrained decoding and support **numeric `enum`**. `{"type":"integer","enum":[10,9,8,6,4,3,0]}` with `additionalProperties:false` makes `7` literally unreachable. This is the cleanest possible answer to "how do you stop it interpolating."

**6. [P1] For the 5 kick-off *range* dimensions, do not ask the model for a number at all.** Ask for the rubric's own band-defining sub-criteria as **booleans + evidence**, and have deterministic code map boolean-vector → band → the anchored integer the rubric names. This moves the 35 most-contested points out of the model's hands entirely. (Decomposed binary decisions vs. Likert: +0.45 average agreement across 12 evaluator models, with reduced variance.)

**7. [P0 — framing, free] Reframe the enum-collapsing argument.** Dropping un-anchored interior values (7 from a 6–8 band) is **not a published technique** — I found no paper studying it. Defend it as *fidelity to the source document* ("the rubric only defines selection rules for these values, so only these values are legal"), never as a known variance-reduction method. And measure **both** flip rate and mean |Δ|: fewer categories raises exact-agreement but increases the magnitude of each disagreement. If dropping 7 lowers flip rate but raises mean |Δ|, **say so in the report**. That honesty is worth more than a clean claim.

### Against plan item 3 (12 calls) — the biggest structural change

**8. [P0] Order every prompt: `[frozen system preamble + line-numbered transcript]` → `cache_control` breakpoint → `[that dimension's spec + output schema]`.** Transcript **first**, dimension spec **last**. Three constraints converge on this ordering: Anthropic's own long-context guidance (documents at top, worth up to ~30% on complex inputs), lost-in-the-middle recency, and cacheable-prefix stability. Getting it backwards loses all three at once. Never interpolate a timestamp, run id, or dimension name into the cached region.

**9. [P0] Pre-warm, then fan out with bounded concurrency.** Send **one** call (or a `max_tokens: 0` warm call) against the cached prefix, **await the first streamed token**, confirm a cache write, *then* dispatch the rest at concurrency ~4 with 429 backoff honouring `Retry-After`. Twelve simultaneous identical-prefix requests all pay full price — none can read what the others are still writing. Naive `Promise.all()` costs ~4× input and buys zero caching. Naive sequencing blows maxDuration 300 on the 65KB file.

**10. [P0] Use `ttl:"1h"`, not the 5-minute default.** The 5-minute TTL is *exactly* your Vercel maxDuration, so any retry lands on or after expiry — and the reproducibility demo is a re-run of the same transcript minutes apart, which the 5m TTL will not cover. Break-even is 3 reads; you have 12.

**11. [P0] Pass `session_id = run_id`** (body field or `x-session-id` header, ≤256 chars) so sticky routing engages from the **first successful request**, before any cache hit is observed. Without it the discount silently evaporates across an intermediary.

**12. [P0] Restructure the call graph: 1 fact pass → 11 or 12 dimension calls → D12 last.**

This is the single most important change and it resolves a defect the current plan has no answer to: **the total caps belong to no dimension.** Three of four kick-off caps and two of six coaching caps are *total* caps. Right now nothing owns them. If all 12 dimension calls emit `cap_signals`, you get twelve independently-sampled votes on the same global fact; they will disagree, and which vote wins becomes an arbitrary tiebreak — a reproducibility hole in the exact place the brief says the work is.

Both rubrics literally instruct this: *"Before scoring, check these conditions."*

- **Fact pass (call 1)** resolves whole-call shared facts and all cap predicates, with line-anchored evidence, looking at nothing else. Coaching: `next_call_booked_live`, `accountability_anchor{exists, named_or_progression_gated, client_confirmed, gated_to, line}`, `struggle_present`, `vision_connection_present`, `action_steps_stated_both_parties`, the four D4 detection criteria, `diagnostics_applicable`. Kick-off: `north_star_constructed`, `any_followup_questions`, `unresolved_client_confusion`, `client_engagement_present`.
- **Inject the resolved facts into all dimension prompts as given premises**: *"ESTABLISHED FACT — do not re-adjudicate: the next call was NOT booked live; L188 states a time but L193 contradicts it."* This decides every cap exactly once, makes the coupling explicit and one-directional rather than emergent, and — the biggest variance win available — removes negative-existential reasoning from the twelve scoring calls entirely.
- **Score D12 last**, in a second wave, with the other eleven results in its prompt as section-presence booleans. D12's negative signals *are* other dimensions' outcomes ("accountability section skipped", "booking feels like an afterthought"). An isolated D12 has no independent evidence base and will return 5/5 "natural flow, all sections present" while D10 returns 0/5. Cost: one extra round-trip of latency, zero extra calls.

**13. [P1] Keep redundant elicitation on exactly two facts.** Require D9/D10/D11/D12 to each emit `next_call_booked_live`, and D6/D7/D11 to each emit `accountability_anchor_exists`, with evidence. Reconcile in code with a **stated conservative-negative precedence rule**: any line-verified quote contradicting the positive claim flips the fact to false — matching the rubric's own instruction ("If a behaviour is not verifiable in the transcript, score conservatively. Never score from impressions"). **Disagreement is the finding, not an error to suppress.** Surface it verbatim.

> *This is the demo.* "Contradictory evidence: L188 states Wednesday the 10th at four is locked in; L193 states the coach will send times later. Booking cannot be verified — D10 scored 0/5 per the non-recoverable rule." That paragraph only exists because the calls were independent, and it is the strongest thing in the deliverable.

**14. [P0] Pin the provider.** `provider: {only:["anthropic"], allow_fallbacks:false, require_parameters:true}` on **every** call, and persist the resolved provider + OpenRouter generation id per dimension row. `anthropic/claude-opus-5` is served by **nine endpoints** under price-weighted load balancing. Three of them (all Google Vertex) **do not list `structured_outputs`** — your enum silently degrades to a hint and the model can emit 7. Two (Azure) **accept `temperature`** where the Anthropic endpoint does not. Unpinned, the reproducibility claim is indefensible on camera.

**15. [P0] Assert no sampling params at the wire level.** Build the JSON body explicitly and add a test that fails if `temperature`, `top_p`, or `top_k` appear anywhere. Vercel AI SDK and LangChain both inject a default temperature. Note the refinement to your premise: on the **first-party** Anthropic API these 400; through **OpenRouter** they are *silently dropped* on the anthropic endpoint and *silently honoured* on Azure. Your conclusion stands; the mechanism is different from what the plan assumes.

**16. [P0] Inspect `finish_reason` on the terminal SSE event.** OpenRouter delivers mid-stream provider failures as an SSE event with `finish_reason: "error"`, **not** an HTTP error. A try/catch around the request alone accepts a truncated response as success and silently mis-scores a dimension.

### Against plan items 4 & 5 (evidence + schema)

**17. [P0] INVERT THE VERIFIER. This is the highest-severity correction in the whole synthesis.** The plan verifies the quote is a substring of *the claimed line*, retries twice, then floors. LLMs get prepended line numbers wrong routinely even when the numbers are right there; the published fix is to have the model reproduce text verbatim and match it back. **The quote is the key; the line number is a hint.**

Algorithm: normalise the quote → strip a leading `/^L\d{1,4}:\s*/` and `/^\[[^\]]{1,60}\]:\s*/` if present → `indexOf` over the **normalised full transcript** → map the offset back to the **original** char span via an offset table → derive the line number in code. Status: `verified` | `verified_location_mismatch` (found, wrong line — **accept, warn**) | `not_found`. Only `not_found` triggers retry.

*Why this matters more than it looks:* as written, one off-by-one turns a genuinely present behaviour into a floored score. That is a false negative **in the direction that looks like diligence**, which makes it the hardest bug to catch in your own demo — and it gets worse with transcript length, i.e. worst exactly where the no-chunking bet is being defended.

**Measured justification for the threshold:** 8-word quotes are 99.7–100% unique across each transcript; 3-word quotes only 87–94%. **Enforce ≥8 words / ~40 chars in code** (schema `minLength` is unsupported) and route short quotes into the same retry path.

**18. [P0] Normalise exactly four things and no more.** NFC; fold the dash family `[‐-―−]` (and defensively smart quotes) to ASCII; NBSP → space; collapse `\s+` and trim. **Not NFKC** (it rewrites ligatures/fullwidth and would let a genuinely different string match). **No case folding in the primary pass** — allow a case-insensitive second pass yielding `verified_case_mismatch`, not silent acceptance. Justification: the corpus contains exactly one non-ASCII codepoint class, U+2014, 158 occurrences across four files. Anything looser buys nothing and risks admitting a paraphrase.

**19. [P0] Store and render the ORIGINAL span, not the normalised string.** Persist `{line, char_start, char_end}` + the raw slice. If you render normalised text, a grader diffing your report against the transcript sees a mismatch and concludes you fabricated the quote. Preserve `[inaudible]` inside any cited span verbatim and **mark such evidence as degraded** — a quote containing `[inaudible]` is materially weaker evidence and the grader will look for whether you noticed.

**20. [P0] REORDER THE OUTPUT SCHEMA. Plan item 5 has it backwards.** In constrained decoding, **property order is generation order**. `evidence[]` → `cap_signals[]` (each with its own evidence) → `reasoning` → `score` → `quick_fix`. A score emitted first is a score the evidence then rationalises, and the JSON still validates so nothing catches it. *Confidence note: the mechanism (left-to-right constrained decoding) is certain; I found no controlled A/B with effect sizes. It is a free change — make it, and if you have 20 minutes run both orders on coaching-01 D10 for your own data point.*

**21. [P0] REWRITE EVERY CAP AS AN ENUMERATION, NEVER A NEGATIVE.** Never ask "were there no follow-up questions anywhere?" Ask: *"List EVERY follow-up question the coach asked, with verbatim evidence. Return an empty array if there are none."* Code computes `absent := verified_instances.length === 0`. This converts an unverifiable model-side negative into a code-side count over positively-verified items, and it satisfies "evidence or nothing" for the absent case — absence becomes an enumeration you can spot-check, not an assertion. **Treat a non-empty list as decisive; an empty list is the claim that needs the retry/not_evidenced path.**

**22. [P0] Add `counter_evidence[]` to every cap signal, and a three-state `determination`.** `fired | not_fired | **indeterminate**`. A boolean cannot express the coaching-01 case. When `supporting[]` and `counter_evidence[]` are both non-empty → `indeterminate` → report *"cannot verify the next call was booked live"* and score the unverified branch **while saying you scored the unverified branch**. Build the test around this before you build the UI.

**23. [P1] Rebuild the retry payload around ALTERNATIVES, not rejections.** Exactly one retry. It must contain: the rejected quote verbatim; the reason (`not_found` | `too_short` | `wrong_line`); **a candidate block of the 10–20 highest-token-overlap real transcript lines, rendered verbatim with IDs**; and an explicit statement that returning `not_evidenced` with an empty array is a fully acceptable answer. Naming the rejection alone measured 36%/18% repair; **supplying alternatives measured 70%/72%** (+36 to +40 points). *Caveat: those figures are from 8B/14B open models — direction robust, magnitude on Opus 5 unmeasured. Do not quote the number on camera.*

**24. [P0] Keep-best across attempts, and diff the score.** If attempt 1 verified 2 of 3 quotes and attempt 2 verifies 1, **keep attempt 1**. Compare attempt-1 score to attempt-2 score; if they differ, persist both, keep the lower, and surface *"score unstable across attempts"* on that dimension. Repair rounds damaged already-correct answers with probability 0.615–0.938 in the measured setting.

**25. [P0] Use CLAMP semantics, not a floor, when evidence fails.** `s ← min(s, default_when_absent)` — cap at the highest bucket that requires no positive evidence, i.e. the rubric's own default-when-absent value. Flooring to 0 is harsher than the source document and destroys ordering information.

**26. [P0] Never put "conservative", "only report high-severity", or "double-check your work" in any prompt.** Anthropic documents that Opus 5 follows conservatism instructions **literally and reports less**, and that carried-over verification scaffolding causes over-verification at no quality gain. Prompt for exhaustive enumeration; keep every conservative word in code.

**27. [P0] Add an explicit anti-halo line to every dimension prompt:** *"Warmth, rapport, likeability, and client enthusiasm are not evidence for this dimension unless the rubric text names them."* Per-dimension calls remove cross-dimension halo but **not** within-dimension tone halo, and coaching-01 is a warm call by construction. Then verify it worked: coaching-01 should **not** score uniformly high.

**28. [P1] The deterministic lexical scan runs AFTER the model, as a falsifier — never injected as a hint.** *This is a direct disagreement between reports and I am adjudicating against the hint-injection design.* One report recommends injecting per-cap candidate bundles into the prompt as an attention-forcing device; the adversarial review argues twelve hand-tuned keyword lists are a second undocumented rubric with no versioning story, and that hinting **anchors the model toward hinted lines and away from unhinted ones — which is how you lose L193 all over again, from the other direction**. The anchoring argument wins, and it costs nothing: run the identical scan post-hoc and use it *only* to contradict negative claims. When a dimension asserts absence and the scan finds a candidate, print *"model reported absent; deterministic scan flagged L193 — unverified."* Same machinery, no anchoring, directly serves the say-what-you-cannot-verify requirement, and it is a defensible thing to have built where a keyword hint table is not.

  *One partial exception, if and only if you have time:* D10 specifically may take a **pairwise adjudication** prompt — "here are two scheduling statements, L188 and L193; are they consistent?" — because unprompted long-document self-contradiction detection is a measured weak spot (GPT-4 reached 34.7% R-acc on documents *shorter* than yours), while a two-sentence NLI-shaped question is where LLMs are strong. That is targeted adjudication, not hinting. *Treat the 34.7% as directional, not a transferable error rate.*

**29. [P1] Add a deterministic ENTAILMENT TABLE, each line citing the rubric sentence it came from.** The rubrics are not 12 independent judgements — they are ~8 judgements the author wrote down more than once. Proof: coaching cap #4 ("No concrete accountability commitment the client owns before close… A single named anchor OR a progression-gated ask… both satisfy this") is **verbatim D7's 5/5 criteria**. Without this table you can ship a PDF that says D7 = 5/5 "anchor confirmed — L189" *and*, four pages earlier, "CAP FIRED: no accountability commitment → D6 capped at 10/15 — L189." Both verbatim-evidenced, both citing the same line, twenty points apart.

  - `D7.score == 5` ⇒ NOT `cap_d6_no_accountability`
  - `D7.score == 0` ⇒ `D11.score ≤ 3` (D11 5/5 requires restating the anchor)
  - `cap_d3_no_vision_anywhere` ⇒ `D9.score ≤ 3` (D9 5/5 requires "leads directly into your ___ milestone")
  - `D10.score == 0` ⇒ D12 must carry the booking negative signal
  - `D4.disabled` ⇒ D12 scored against the SOP checklist **minus** movement coaching
  - `D8.score == 5` (no-struggle default) ⇒ no other dimension cites client-struggle evidence
  - kick-off: `cap_no_north_star` ⇒ `D6.score ≤ 7`; `cap_no_followup_questions` must be FALSE if D4 or D8 cite any coach question

  On violation, re-ask **one** dimension (the one with weaker evidence) naming the conflicting quote. Violate twice → **print the conflict in the report** rather than silently picking a side. Cap total model calls per run so retries cannot run away.

  This is not scope creep. Every assertion is a sentence the author already wrote, and it is the literal answer to *"Turning one into something that scores a transcript THE SAME WAY TWICE is the work."*

### Against plan item 6 (talk-share)

**30. [P0] Never compute or display a turn-based talk ratio.** All four transcripts are strictly alternating: every speaker sits at 49–51% of turns regardless of how lopsided the call is. It's a constant here and would look like a bug. Use word share, cross-checked against char share (they agree within 0.6pp on every file), and assert `|word_share − char_share| < 2pp` or flag the parse. `words_per_turn` is the metric that actually separates: coach 41.3/39.7/53.8/29.4 vs. client 20.5/23.5/26.3/11.0.

**31. [P0] Do not emit a bare boolean for the >70%/>75% caps.** kickoff-02 measures **73.4% coach word share**, but the cap is phrased in **time**, and plausible speaker-rate asymmetry flips it: at r = coach_wpm/client_wpm = 1.2, time share falls to **69.7%** and the cap does not fire. kickoff-01 (67.8% words) crosses the *other* way at r=0.9 → 70.0%. Emit `{word_share, char_share, interval_at_r_0.8_to_1.2, threshold, verdict, boundary_sensitive}` and **publish the written tie-break rule in the pack**: fire on point-estimate word share; if the interval straddles, mark *"boundary — decided on word share, time not observable."* Put the interval on the PDF next to the verdict. The grader will find that boundary.

**32. [P0] Identify the coach with three agreeing heuristics and refuse if they disagree** — first speaker, highest word count, highest question count. All three agree on all four fixtures (Priya, Marcus, Dana, Ivan). Disagreement → ask the operator. A legitimate, explainable failure beats a guess.

### Against plan item 7 (no chunking)

**33. [P0] Keep the decision. Replace the justification.** Delete "16k tokens against a 1M context window" as the *reason* — NoLiMa and RULER contradict it (at 16K: GPT-4.1 84.9 vs base 97.0; Claude 3.5 Sonnet 45.7 vs base 87.6, effective length 4K; RULER: "almost all models fall below the threshold before reaching claimed context lengths"). Replace with:
  (a) the task is a whole-document universal-quantifier judgement, so chunking is unsound **at the specification level regardless of window size**;
  (b) the caps are evaluated *before* scoring and cannot be established on a subset;
  (c) I measured rather than assumed.

  Two mitigations you can legitimately cite: NoLiMa deliberately removes literal lexical overlap between question and needle, and your **line-numbered transcript + verbatim-quote requirement restores literal anchors** — plan item 4 is accidentally the correct mitigation for the exact mechanism NoLiMa blames. And Opus 5 is not in those tables.

**34. [P1] Add an explicit input-size guard that fails loudly.** The bet is safe at ~18k tokens (1.8% utilisation). It is not a policy that holds at arbitrary length — the 30–50% degradation cliffs are measured at 50k–113k. An operator pasting a 3-hour multi-session transcript must get a specific refusal, not silent degradation. That is also the brief's "says WHY."

### Against plan item 8 (the 105 defect) — **replace the rule entirely**

**35. [P0] Keep normalisation, but make it ORDERED, EXPLICIT and VISIBLE.** The transform is right; the "no special case" claim is false in both cases it names.

Fixed pipeline, in exactly this order:
1. Per-dimension scores from the enums.
2. Apply **dimension** caps (D3→max 10, D6→max 10, D8→0, D10→0).
3. Resolve the active set. **If D2 is N/A, apply the rubric's own written rule** — *"redistribute weight to D3 and D4"* — promote D3 and D4 maxima to 20 each and scale proportionally. Do **not** drop D2 into the denominator; that spreads its 10 points across all eleven survivors, which is a different instrument and costs a band flip (worked case: 89.5 STRONG under the bet vs 90.5 ELITE under the rubric's rule; inverse case diverges 4.3 points the other way). **If D4 is disabled, denominator 90.**
4. `raw = Σ scores`; `denom = Σ active maxima`.
5. `reported = round(raw / denom * 100)`.
6. Apply **total** caps in **REPORTED space**, then clamp to [0,100].
7. Derive band from reported.

**Step 6 is the one that is currently backwards.** The natural implementation (sum → cap → normalise) turns "Max 70 total" into a reported **67** and "Max 75" into **71** — both band flips. Proof that caps live on the 100-scale: the kick-off caps are 70/75/80, and **80 is the STRONG floor while 70 is the INCONSISTENT floor** in both bands tables. The author authors caps at band boundaries on an assumed 100-point scale.

**36. [P0] Disclose the D4-off denominator.** Principle 6 literally says *"scored out of 85… the percentage is the raw score over 85."* That is unimplementable — raw max is 90 and 90/85 = 105.9%. So 90 is correct — but it is a **repair to be declared, not quietly substituted**. Bands disagree at raw 70, 71, 77, 78, 79, 80 (raw 78: ELITE by the document, STRONG by the bet).

**37. [P0] Do NOT "fix the typo." The typo hypothesis is dead.** D3 and D6 maxima are each restated **six times** (header, four bucket rows, plus the cap table). D1/D2/D5 restate "/10" five times each, and their 10/7/3/0 bucket enum is illegal on a 5-point scale. Every dimension max is over-determined 5–6×; the "100" is the only under-determined figure in the document. Also note 85 = 100 − 15 — one belief stated twice, so the two totals are not independent constraints and **any** 5-point reduction in a non-D4 dimension reconciles both. There is nothing to discriminate on.

**38. [P0] Surface it — this is where the grading points are.** Emit `raw`, `denom`, `normalisation_factor`, `caps_fired` (with evidence), `reported`. Print one line in the report:

> *"This rubric's twelve dimensions sum to 105 while the document declares 100. Raw 92/105, normalised to 88/100. Dimension weights are preserved exactly; the declared total is the figure this system treats as stale."*

  Add `TOTAL_RESOLUTION: 'normalize' | 'clamp' | 'reweight_d6'` to the pack, defaulting to `normalize`, with a comment recording that **all three readings are equally deterministic** and normalisation was chosen because every dimension max is restated 5–6× while the total appears only as a derived aggregate. That is the cheapest possible proof you found three readings and picked one on stated grounds rather than tripping into one. Add an assertion that logs whenever `Σ maxima != 100` so the normalisation never silently becomes a no-op after a future rubric edit.

  *Why this matters disproportionately:* normalisation is the only one of the three readings that leaves **no visible artefact**. Clamping shows 105→100. Re-weighting shows D6 as /10. Normalisation prints a plausible number and hides that you noticed anything — and the PDF will show twelve scores a reader can add to 105 under a header saying 100. To the one grader who wrote this rubric, an unannotated arithmetic mismatch reads as a bug you missed, not a decision you made. **The defect is the single most interesting object in the source material. Do not spend it on a silent division.**

### Against plan item 9 (model / OpenRouter)

**39. [P0] `reasoning: {effort: "high"}` — and NEVER `reasoning: {max_tokens: N}`.** The latter maps to Anthropic `budget_tokens`, which **400s on Opus 5**. This is the least-documented part of the whole stack; test it in the first hour. Pin `effort` as a versioned constant in the pack and store it on the run row — adaptive thinking means reasoning length varies per run, which you cannot turn off, but you *can* stop it varying from your own config drift.

**40. [P0] Assert OpenRouter response caching is OFF.** Do not send `X-OpenRouter-Cache`. It replays byte-identical responses at zero cost, and if it is ever on during a reproducibility measurement you are measuring OpenRouter's HTTP cache, not your scorer — headline claim void. Add a code comment saying why. *It is genuinely useful for frontend/PDF development against a frozen fixture; keep it out of anything you measure.*

**41. [P0] Reframe determinism on camera.** Sampling params are removed on Opus 5 (400 on every request regardless of thinking) — but **greedy decoding was never deterministic anyway**: sampling 1,000 completions from Qwen3-235B at temperature 0 produced 80 distinct outputs, diverging as early as token 103, because batch-size-dependent reduction kernels take different arithmetic paths under different server load. Fixing it needs custom batch-invariant kernels at ~61.5% throughput cost, available on no hosted API. So: *"I'm not buying bit-identical sampling. I'm buying decision stability under sampling noise."* That reframe is the thesis of the build and it is defensible from a primary source. The restriction costs you nothing you had.

**42. [P1] Selective repeat-voting only — and NOT on D10.** *Adjudicating a disagreement:* one report recommends N=3 median on the 5 range dimensions, every cap predicate, and the D4/D2 switches. Two things cut against blanket application. First, if you adopt #6 (booleans → band for the range dimensions), the variance is removed at the source and N=3 there is redundant spend. Second, **self-consistency backfires on hard items**: "when a model places its highest probability on an incorrect answer across independent samples, more samples only entrench the wrong vote." If the modal read of coaching-01 D10 is "booked," N=3 makes it **more stable and more wrong**. Adopt: **N=3 with median on the fact pass only** (caps + D4/D2 switches), never on D10's contradiction resolution — that lives in deterministic code per #13/#22. And if you report jury size K, report the inter-sample error correlation ρ alongside it; three samples from one model are not three independent raters.

**43. [P0] Fix the D4-flip compounding.** A D4 switch moves 15 points **and** changes the normalisation denominator, so one boolean flip moves the reported total twice. Require the D4 detection to be unanimous across the fact-pass samples AND evidence-verified, and **print the active denominator and which dimensions were active** on the report. A silent boolean must never move a headline number without the report naming it.

### Against plan item 10 (background work / Vercel + Supabase)

**44. [P0 — HIGHEST SEVERITY NON-MODEL FINDING] Supabase Free pauses a project after 1 week of inactivity.** *"Free projects are paused after 1 week of inactivity."* Paused projects are restorable but the URL does not resolve until a human clicks restore. If the grader opens a run link 8 days after the demo, **hard constraint #1 fails visibly and there is no runtime workaround.** Either pay $25 for Pro (say so on camera: *"Free pauses after a week and the brief requires the URL to resolve next week, so I paid $25 rather than gamble the hardest constraint"*), or add a daily Vercel Cron (`0 9 * * *` — daily *is* allowed on Hobby) hitting `/api/keepalive` that runs a real `select`. **Do not** rely on pg_cron for the keepalive: whether internal cron queries count as "user activity" is **undocumented** (low confidence, no primary source either way), and the docs' wording is *"a few user requests to the database each day."*

**45. [P0] Move the stale-run sweep OFF Vercel Cron and INTO Supabase pg_cron.** **Vercel Cron on Hobby runs once per day with ±59 minutes of jitter**; a more frequent expression fails at deploy time. A Vercel-Cron sweeper detects a dead run up to ~25 hours late — the operator gets the infinite spinner the brief forbids. pg_cron runs `* * * * *`, needs no HTTP, and self-documents in `cron.job_run_details`.

**46. [P0] Claim runs with a single atomic conditional UPDATE. No advisory locks.** `pg_advisory_lock` is **session-based and unusable through Supavisor transaction mode (port 6543)** — you acquire on one backend and may unlock on another, leaking the lock forever. Use:
```sql
update runs set status='running', attempt=attempt+1, lease_owner=$2,
  lease_expires_at=now()+interval '5 minutes', heartbeat_at=now(),
  started_at=coalesce(started_at, now())
where id=$1 and (status='queued' or (status='running' and lease_expires_at < now()))
returning *;
```
Zero rows returned ⇒ someone else owns it ⇒ return immediately. Read Committed re-evaluates the WHERE clause against the updated row version, and your predicate is **monotonic and PK-targeted**, which is exactly the case where re-evaluation gives mutual exclusion. (The Postgres docs' counter-example — a predicate whose truth can flip back and forth — does not apply.) Always check the returned row count.

**47. [P0] The DB, not the runtime, is the durability layer.** `after()` is best-effort: no retries, no redelivery, no dead-letter, bounded by the same maxDuration, and **cancelled if the function times out**. Commit each dimension the instant it resolves — `dimension_results(run_id, dimension_id) primary key`, 12 rows pre-inserted as `pending`. A timeout then loses only unfinished dimensions, the status page can honestly say "7/12 scored", and any retried worker is idempotent by construction. This is what makes "close the tab and come back" true rather than aspirational.

**48. [P0] Use `getDeadline()` to self-abort gracefully.** If `deadline − now < 20s`, write `failure_code='deadline_exceeded'`, `failure_detail='Ran out of function time with 7/12 dimensions scored'`, and return. This beats the sweeper by ~90s and is the cheapest possible satisfaction of "a failed run says WHY." *Note it returns `undefined` outside the Vercel runtime including `next dev`, so guard it and test the path on a preview deployment with a low maxDuration.*

**49. [P0] Enforce "says WHY" in the SCHEMA, not in discipline.**
```sql
check (status <> 'failed' or failure_code is not null)
check ((status in ('succeeded','failed','cancelled')) = (finished_at is not null))
```
It becomes structurally impossible to ship the infinite-spinner failure mode.

**50. [P0] Do not expose these tables via the Data API.** A policy of `for select to anon using (true)` does **not** implement "read by ID only" — it lets anyone with the publishable key run `GET /rest/v1/runs?select=*` and enumerate every transcript, score and quote you have ever stored. The unguessable URL protects nothing because the attacker never needs the URL. Put everything in an `app` schema, remove `public` from Exposed Schemas, and render the run page in a **Server Component using the secret key**. Enable RLS with no permissive policy anyway, so a future accidental exposure fails closed. Share token: **UUIDv4 or nanoid(21), not UUIDv7** — RFC 9562 §8 directs implementers to v4 for security-sensitive identifiers, and v7 both leaks creation time and carries 48 fewer random bits. Use a `bigint identity` PK internally for index locality and cheap FK joins.

**51. [P0] Map OpenRouter errors to distinct human failure reasons.** 402 → "out of OpenRouter credit"; 408 → "model timeout"; 429 → "rate limited, retrying"; 502 → "provider returned invalid response"; 503 + `availability.code=constraint_filtered` → "pinned provider unavailable". This is "says WHY" satisfied with attributable causes rather than a generic string. Note that pinning trades availability for reproducibility — with `allow_fallbacks:false` an Anthropic outage fails every run. That is the correct trade here, but the failure surface must genuinely work or an outage looks like a broken app.

**52. [P1] Idempotency via a PARTIAL unique index.** `create unique index runs_idem_live on runs (idempotency_key) where status in ('queued','running','succeeded');` — dedupes live and successful runs while leaving a **failed** run retryable with identical inputs, which is exactly when you most want a retry. Key = sha256 over canonical JSON of `{transcript_sha256, call_type, rubric_pack_sha256, prompt_template_sha256, model_id, model_params_sha256, scorer_version}`, computed in TypeScript (pgcrypto's `digest()` is not IMMUTABLE and will be rejected in a generated column). Surface the dedupe in the UI — *"this exact transcript + rubric + model was already scored, here is that run"* — with an explicit force-new escape hatch. Silently redirecting is defensible; silently appearing to do nothing is not.

**53. [P1] Evidence as separate ROWS, raw model responses in their OWN table.** ~36 evidence rows per run — no scale argument for a jsonb blob, and `count(*) filter (where not verified) = 0` is a constraint you can defend where digging into a jsonb array is not. `model_calls(run_id, dimension_id, attempt, response_raw jsonb, finish_reason, token counts, openrouter_generation_id, latency_ms, http_status, error)` as a sibling table (~13 rows × a few kB = well under 100kB/run) — physical separation stops a stray `select *` on the run page dragging every raw Opus response over TOAST. It is also your retry audit trail: attempt 1's rejected quotes are the proof your verifier works.

**54. [P0] Status as `text` + `CHECK`, not a native Postgres enum.** `ALTER TYPE ... ADD VALUE` inside a transaction block cannot use the new value until after commit, which breaks single-transaction migrations; enum values can never be removed or reordered.

**55. [P1] Status page: poll, don't Realtime.** `force-dynamic`, read the run row + `count(dimension_results)`, poll every 2s until terminal. Render four distinct states — queued / running (n/12) / succeeded / failed with `failure_code` + `failure_detail` verbatim. A 12-transition ~120s job does not need a websocket, an RLS policy on `realtime.messages`, and a reconnect story. Defensible as deliberate restraint. (If you ever do want it: Broadcast-from-Database, **not** Postgres Changes — the latter runs one RLS check per subscriber per change.)

**56. [P0] `prepare: false` on the transaction-mode pooler**, or use supabase-js over HTTPS (which sidesteps the whole connection-exhaustion class on Nano compute). Never a direct `:5432` pool from a serverless function.

### Against plan item 11 (PDF)

**57. [P0 — do this in hour one, before any design work] Deploy a hello-world route that calls `renderToBuffer` on a two-page document with one registered custom TTF and one SVG arc, on the actual deployed Vercel runtime.** react-pdf only claims testing against Node 18/20/21, which is behind Vercel's default. This is the whole risk of the topic, retired in under an hour, and a Windows-local-only test will not catch it.

**58. [P0] Design the PDF FIRST, or design both to a shadow-free system.** `box-shadow` and `text-shadow` **do not exist** in @react-pdf/renderer, and there is no CSS gradient for a View background. `borderRadius` is supported. Units are pt/in/mm/cm/%/vw/vh — **no px, no em, no rem**. If you design the web UI with elevation and then port, the PDF looks like a downgrade of the thing the grader already saw. Build from hairline rules, flat fills, borderRadius, whitespace. Gradient band = absolutely-positioned `<Svg><LinearGradient>` underneath the content.

**59. [P0] Fonts: static TTF per weight, embedded as base64 data URIs generated at build time.** WOFF2 is unsupported; **variable fonts do not work at all** (PDF 2.0 can't represent them). Data URIs delete filesystem tracing, `/public` path ambiguity, and any network fetch from the render path in one move. **Check the licence** — embedding a TTF is redistribution; SIL OFL (Inter static, IBM Plex, Source Serif 4) permits it, many others do not. This is exactly the detail a grader screening for vibe-coders notices.

**60. [P0] Wrap the render in a hard timeout and record `pdf_render_timeout` as a distinct failure reason.** react-pdf has a long-lived family of layout bugs that **hang rather than throw** (oversized paddingBottom, fontSize larger than page height, deeply nested Views with page padding, `break` in certain structures, `minPresenceAhead` + `fixed`). A hung `renderToBuffer` inside `after()` burns the whole 300s and dies to the sweeper with a useless message. `Promise.race` with a 45s reject. Do this even though the megathread issue is closed. Keep the document structurally shallow — deep nesting inside padded Pages is the most-cited trigger.

**61. [P1] Render inside the same `after()` job, store the buffer in a private Supabase Storage bucket keyed by run id, serve via signed URL.** Columns `pdf_status ('pending'|'ready'|'failed')`, `pdf_path`, `pdf_error`. Download button appears only on `ready`; the specific error string appears on `failed`. Never a spinner. *Decide deliberately and say so: a stored PDF is frozen at render time, so a later scoring fix does not change old URLs. An auditable frozen record is a defensible position; an accidentally stale one is not.*

**62. [P1] Use the PDF-native primitives — this is the cheap taste win.** `wrap={false}` on every verbatim quote block so a quote can never split across pages; `minPresenceAhead={60}` on dimension headings; `bookmark={{title:'D4 — Movement Coaching', fit:true}}` per dimension for a real 12-entry navigable outline (the PDF-native answer to "collapsible sections", ~15 lines); a `fixed` footer with `render={({pageNumber, totalPages}) => ...}` carrying **run id, rubric pack version, generated-at**. For a reproducibility-themed exercise, a PDF that carries its own rubric version on every page is the single cheapest credibility win available.

**63. [P0] Give `not_evidenced` an explicit visual treatment in the design system before writing the PDF.** Muted fill, distinct label, visibly different from a scored dimension. "Evidence or nothing" has to be legible in the artifact, not just in the JSON.

---

## 3. PLAN CHANGES — REJECT

Each of these was researched with a real answer and declined. Say them on camera in one sentence each.

| Rejected | Why |
|---|---|
| **Gemini embeddings / Cohere Rerank / Voyage / any vector store** | The caps are whole-call negatives; top-k is open-world so an empty set means *not surfaced*, not *not present*. Plus the decisive contradiction line is the *lower*-similarity one, so a reranker would actively cause the D10 failure. Notably **not** rejected on integration burden — OpenRouter exposes `/rerank` and `/embeddings` on the same key, zero new vendor. It loses on correctness. |
| **Embedding-based "cluster sections to SOP phases"** | Inverts coaching D12's calibration. D12 scores woven transitions ELITE and robotic announcements MID; explicit section markers are what embeds most cleanly. The one dimension where it sounded most plausible is where it is most harmful. |
| **Cosine similarity as a run-vs-run consistency check** | Scores come from a fixed enum and evidence resolves to specific lines, so reproducibility is exact tuple equality. A defended arbitrary threshold ("why 0.87?") is strictly worse on camera than set equality, which needs no defence. |
| **Fuzzy / Levenshtein quote matching** | *Disagreement between reports; adjudicated against.* One recommends a deterministic fuzzy fallback above a fixed versioned ratio. The motivation for fuzzy matching in the literature is **PDF extraction noise** — hyphenation, mid-word spaces, ligatures — which you do not have: clean UTF-8 you control end to end, one non-ASCII codepoint class. The documented cost of fuzzy is **accepting fabricated-but-on-topic quotes**, which breaks the brief's core promise. Single dash normalisation removes the only realistic false-rejection class; whole-transcript search (#17) removes the other. |
| **Anthropic native Citations API** | Two independent kills. (1) Documented 400: *"If you enable citations… and also include the `output_config.format` parameter, the API returns a 400 error."* You need a strict schema. (2) OpenRouter normalises to OpenAI-shaped content parts and documents no `document` blocks or citations passthrough — its `annotations` field is PDF-parse metadata, a different mechanism. *(Reason 2 is inferred from absence in docs, not an explicit denial — reason 1 already settles it, so don't state 2 as fact without the curl.)* |
| **Off-the-shelf NLI contradiction model** | NLI models process two texts at a time; that architecture "makes them inadequate as context validators, particularly for identifying self-contradictions." The ordering signal is deterministic; the adjudication is a targeted pairwise question. |
| **Injecting per-cap keyword bundles into the prompt as attention hints** | Twelve hand-tuned lexical lists are a second, undocumented rubric with no versioning story, and hinting anchors the model toward hinted lines and away from unhinted ones — which is how you lose L193 from the other direction. Same machinery, run **post-hoc as a falsifier**, has all the benefit and none of the anchoring. |
| **Grouping the coupled dimensions into joint calls** | The natural grouping is exactly `{D6, D7, D10, D11}` — precisely the cluster coaching-01 attacks. Merging hands one call the warm closing block and gets one coherent wrong narrative, with the L193 contradiction smoothed away as a pleasantry. It converts four independent chances to notice the trap into one, and concentrates the halo exactly where the transcript sets the halo trap. |
| **N=3 across all 12 dimensions** | 36 calls × 16k tokens, and it won't fix the adversarial case — majority voting on hard items entrenches a confidently wrong modal answer. Selective on the fact pass only. |
| **Supabase Edge Functions as the worker** | Rejected on numbers: 150s wall clock on Free (400s paid), **2s max CPU time**, 256MB. Your workload is 60–180s. Cite this as a measured rejection, not a preference. |
| **Vercel Queues** | Public beta, trigger type literally `queue/v2beta`, requires a permissions grant, no built-in DLQ, and **topics are partitioned by deployment ID** — an active footgun while you redeploy 30× over four days. The redelivery guarantee is reproducible in ~15 lines of SQL. |
| **Vercel Workflows** | Its value is sleeps, human-in-the-loop, and runs spanning days. You have none of those — 12 independent calls in one two-minute burst. Beta SDK (5.0.0-beta.x), and "Workflow Data Retained is not available on Hobby" with 1-day retention. Adopting a durable-execution engine for this is exactly the unrequested scope being screened for. |
| **Supabase Realtime for the status page** | 12 transitions over ~120s. Polling is fewer moving parts. Deliberate restraint. |
| **Puppeteer / Chromium PDF** | *And note the usual argument is now wrong:* Vercel Large Functions allow 5GB uncompressed as of 2026-06-30, so "250MB" is a dead objection and will be caught. Reject on: cold-start (2–4s browser boot + /tmp decompression + 5–10s layout), 2GB/1vCPU Hobby ceiling shared with 12 in-flight model calls in the same 300s window, and Vercel's own template introduces a **runtime binary download** into the render path. Concede the trade honestly: you give up real CSS to get a render path with no browser, no /tmp, no binary fetch. |
| **Browser-side PDF (html2canvas / jsPDF / window.print)** | Disqualified by the brief, not merely inferior: html2canvas rasterises the DOM, so the PDF has **no selectable or searchable text**. One sentence — *"the report is evidence; evidence you cannot select, search or copy is not evidence."* Same argument kills `window.print` (operator's browser controls margins, headers, font substitution). |
| **Hosted PDF APIs (DocRaptor, Cloudflare Browser Rendering)** | Third vendor, third secret, billing relationship, and it ships the operator's coaching-call transcript to an outside renderer. Against a brief that specifies Supabase + Vercel and grades "no scope you were not asked for." |
| **A calibration layer** (the highest-value ablation in the closest published system, −64% QWK) | **You have no human-scored ground truth to calibrate against, and building one is a different project.** Say this out loud rather than building it — it's the most impressive rejection available because it declines the biggest published win for a stated reason. |
| **Anthropic Batch API** (50% cost, and your architecture tolerates async latency) | Needs a direct Anthropic key; the user has OpenRouter. And it trades bounded ~5-minute completion for unbounded. An explicit reasoned no beats silence. |
| **Sentiment scoring, topic modelling, speaker diarisation** | Not asked for, not needed, new failure surface. |
| **`supportsCancellation: true` in vercel.json** | Opt-in and off by default. Leaving it off means a closed tab cannot signal cancellation at all — which is what you want. Return 202 in <1s so the answer is "the response was already sent, nothing to cancel." |
| **`VERCEL_SUPPORT_LARGE_FUNCTIONS`** | Don't need it with react-pdf; public beta; incompatible with Secure Compute and Static IPs. Know the fact; don't take the dependency. |
| **UUIDv7 for the share token** | RFC 9562 §8: *"MUST NOT be used as security capabilities"*; v7 leaks creation time and carries 48 fewer random bits. v7's index-locality argument does not apply to a token you only look up by equality. |

---

## 4. MUST MEASURE BEFORE BUILDING ON IT

Ranked by "how much rework if the assumption is wrong." **Items 1–4 are hour-one blockers.**

**M1 — `reasoning.effort` mapping on Opus 5 via OpenRouter. BLOCKING, do first.**
The single largest unverified assumption in the stack, and the only one that could hard-fail every call. OpenRouter's docs describe an `effort → max_tokens × ratio → budget_tokens` computation that would **400 on Opus 5**; the endpoint's `supported_parameters` lists both `reasoning` and `reasoning_effort`, suggesting a native effort translation. Docs don't say which, for opus-5 specifically. There is at least one open bug report of `reasoning_effort` being a silent no-op over OpenRouter for a Claude model.
**Probe:** POST one minimal request with `reasoning:{effort:"high"}`, provider-pinned. Record HTTP status and whether `usage.completion_tokens_details.reasoning_tokens` (or equivalent) is non-zero. Then repeat with `effort:"low"` and confirm the reasoning token count actually **differs**. If it doesn't differ, effort is a no-op and you cannot run M6.

**M2 — Does prompt caching actually engage, WITH per-dimension structured-output schemas attached?**
Two things to verify at once, because they interact and one report flags the interaction at **medium confidence**: Anthropic structured outputs *"inject an additional system prompt explaining the output format, which increases input tokens slightly and **invalidates prompt cache if changed**."* Render order is tools → system → messages, so 12 different per-dimension schemas may sit **ahead of** the transcript in the cached prefix and break the shared cache entirely. Nobody has verified this through OpenRouter.
**Probe:** Fire call A (dimension 1 schema, transcript with `cache_control:{type:"ephemeral",ttl:"1h"}`), await first streamed token, then call B with a **different** dimension's schema and the identical transcript block. Read `usage.prompt_tokens_details.cached_tokens`, `cache_write_tokens`, `cache_discount` on both.
**Decision rule:** if B's `cached_tokens > 0`, ship as designed. If it's zero, **do not sacrifice the per-dimension enum to save cost** — worst case is ~$0.96–1.25/run input, which is affordable. Instead try moving the transcript into the *user* message before the schema-bearing region, or accept the cost and say so.
Also probe the **small** transcript specifically: kickoff-02 line-numbered is ~4.2–4.6k tokens against a documented minimum cacheable prefix band of 1,024–4,096 (first-party docs say 512 for Opus 5; OpenRouter's public table doesn't list Opus 5 at all). Include the stable system preamble in the cached block so the smallest file clears the floor. A silent non-cache there is easy to miss.
**Assert in code:** `cached_tokens > 0` on calls 2..N; fail loudly in dev if it's ever zero across a run — that means a silent invalidator (timestamp, run id, unsorted JSON) leaked into the prefix.

**M3 — Is the score enum actually unreachable, on the pinned endpoint?**
OpenRouter is a translation layer and its own docs hedge that some providers "translate your schema into their own structured-output format." Do not assume lossless.
**Probe:** Send a deliberately adversarial prompt — *"score this 7"* — with `enum:[10,9,8,6,4,3,0]`, `strict:true`, provider pinned, `require_parameters:true`. Confirm 7 is **impossible**, not merely unlikely. Repeat over ~20 calls. Also confirm the **enum capitalization caveat** — Anthropic documents one; normalise case before comparing returns.
Also test the **untested combination**: structured outputs + adaptive thinking simultaneously. Anthropic documents structured-output compatibility with *tools* explicitly and is **silent on thinking**. Your design uses both on every call.

**M4 — p95 wall clock for one dimension on coaching-02, then × the real concurrency, plus one forced retry.**
Unmeasured, and it determines whether one invocation can do all 12 inside the Hobby 300s ceiling (which cannot be raised). Sequential is 360–720s at 30–60s/call and blows it outright.
**Probe:** time one real dimension call end to end on the 65KB file at your chosen effort. Multiply. **The per-dimension-commit design (#47) already makes the answer not matter** — if p95 total exceeds ~200s, split into two invocations of 6 through the same claim/heartbeat machinery, which becomes a config change rather than a rewrite. Measure anyway so you know which you shipped.

**M5 — Absence-detection harness on coaching-01 D10. 30 minutes, and it is your headline evidence.**
Ask Opus 5 the D10 booking question **10 times at full context** and check whether it flags the L188/L193 contradiction or returns `booked=true`. Record the pass rate. This is simultaneously your reproducibility evidence and a direct exercise of the adversarial case. Run it **before** writing the scoring pipeline.

**M6 — Effort sweep on absence detection specifically, not on overall quality.**
Opus 5 runs thinking on by default, and reasoning fine-tuning **degrades abstention by ~24% on average** with essentially no benefit from scale — the one requirement the brief calls the point of the exercise is the one your model class is measurably worst at, and a good system prompt "does not resolve models' fundamental inability to reason about uncertainty."
**Probe:** score all four transcripts at effort low / medium / high and measure **one number** — on dimensions you have hand-labelled as absent, how often does the system report absent. Pick the level that maximises that, not the one with the prettiest prose. *Note `thinking:{type:"disabled"}` 400s at xhigh/max effort, so "off" is only available at high or below.* Gate this behind M1.
*Time-box it. If M1–M5 eat your first day, run M6 on two dimensions and one transcript rather than skipping it — you need the number, not the full grid.*

**M7 — 5-run stability report as a first-class artifact.**
Per dimension: modal score, exact-agreement rate across 5 reruns, mean absolute point delta, quote-verification pass rate, cap-boolean unanimity. Per run: total mean with 95% CI and a **clustered** standard error (dimensions within a transcript are not independent; clustering can inflate SEs up to 3×). Stamp model id, provider, effort, both hashes.
**Baseline to beat, and cite it:** an unengineered pointwise LLM judge measures ICC(2,1) 0.58–0.77 with **44.7% of total score variance being within-judge noise**, and semantically equivalent prompt rewordings flip the majority outcome **25%** of the time. If your per-dimension exact-agreement across 5 reruns exceeds 0.90, you have a real result and you can say **by how much** you beat published baseline.
**Do not quote the closest published system's ≤1–2% fluctuation figure as yours — it ran at temperature 0.0, which you cannot.** This is the most likely place to get caught overclaiming.

**M8 — Pair every determinism number with a correctness assertion.**
Reliability and validity dissociate sharply: test-retest α of 0.943 coexists with position-flip rates up to 0.253; exact-match agreement overstates chance-corrected agreement by 33.8–41.3 points. **A stability report showing 100% reproducibility is not a pass on its own** — coaching-01 was built to catch a system that is stably wrong. Ship a small assertion suite: coaching-01 D10 must resolve to contradicted/cannot-verify (not 0/5 by guess, not 5/5 by vibes); each cap must fire or not fire as hand-labelled; the 105-vs-100 defect must appear in the UI as a known source-document defect with your resolution stated.

**M9 — Line endings on the fixtures.** Reports disagree (CRLF vs LF-only). **One `file` / hexdump call settles it — but ship `canonicalise()` regardless** (strip BOM, CRLF/CR→LF, NFC, rstrip each line, drop trailing blank lines) and unit-test it against all four fixtures. Hash the **output**, store the output as `transcripts.body`, number lines against it. Then the disagreement is moot. Good news either way: zero blank lines and 100% of 813 lines match `^\[([^\]]+)\]:\s?(.*)$`, so canonical line number == speaking-turn index for citation purposes.

**M10 (5 minutes, optional but cheap) — curl OpenRouter with an Anthropic `document` + `citations:{enabled:true}` body and keep the error.** Closes the "why not native Citations?" question with a screenshot instead of an inference.

**Cost — flag as UNMEASURED, do not quote on camera.** Four reports produced $0.19, $0.55, $1.35, and $2.28 per run on the 65KB transcript. The divergence is almost entirely **output/thinking tokens at effort=high**, which nobody measured and which is billed at $25/M. The **input** side is well-determined: ~$1.05–1.25 uncached, ~$0.30–0.43 cached. State it as: *"input drops ~4× with prefix caching; thinking output dominates the cached total and I measured it at $X"* — after you have measured X.

---

## 5. SURVIVED / DID NOT SURVIVE

### Bet 1 — "Do not chunk. Send the whole line-numbered transcript in every one of the 12 calls."
**DID NOT SURVIVE as stated. The half everyone expects to break is the half that holds.** Be precise about which half.

**"Do not chunk / do not retrieve" survives outright and should not be revisited.** Four reasons, three from the exercise's own artifacts rather than from literature: the adversarial trap is retrieval-shaped by construction (the falsifying line is the one a retriever is least likely to return); the caps are negative existentials evaluated *before* scoring and are unfalsifiable on a subset; the rubric's own scoring principles demand whole-call reading ("did it actually land" — the landing is often turns later); and 18k against 1M is 1.8% utilisation, with the dramatic degradation cliffs measured at 50k–113k.

**The second clause — "in every one of the 12 calls" — fails, because it is stated as a settled decision while missing every operational commitment that makes it safe.** No `cache_control`. No stated prompt ordering (and the plausible-sounding instinct — dimension spec first — loses both the ~30% long-context gain and all cache reuse simultaneously). No concurrency or timeout plan against maxDuration 300, where sequential blows the clock and naive parallel pays 12 cache writes. **No owner for the global caps** — three of four kick-off caps and two of six coaching caps belong to no dimension and currently have nowhere to live. And a quote verifier that punishes the model for the single thing (numeric line attribution over 346 lines) that long line-numbered context makes least reliable — a false-negative generator sitting directly downstream of the bet.

**The version that survives:** send it whole, line-numbered, **as a 1h-TTL cached prefix, first in the prompt, dimension spec last, across 13 bounded-concurrency calls in two waves, with quotes verified against the whole transcript rather than an asserted line, and the caps owned by a dedicated fact pass.** All of that is ADOPT #8–#14 and #17.

### Bet 2 — "One model call per dimension, not one call scoring all 12."
**SURVIVED — narrowly, and only because the obvious remedy is affirmatively worse.**

The coupling complaint against it is **correct and textual**, not speculative: coaching cap #4 is the *verbatim text* of D7's 5/5 criteria, transcribed twice into two places. D11's 5/5 presupposes D7's output. D9=5/5 logically falsifies D3's cap. D12 is a pure meta-dimension whose negative signals *are* other dimensions' outcomes. The author modeled ~8 judgements; the architecture splits them into 12 and sums.

**But grouping fails on both axes this exercise grades.** On the adversarial case: the natural grouping is exactly the cluster coaching-01 attacks, and merging hands the model one warm closing block and asks for one coherent narrative — which it will produce, with L193 smoothed away as a pleasantry. Four mutually-consistent wrong scores. It converts four independent chances to notice the trap into one, and concentrates the halo where the transcript sets the halo trap. On reproducibility: holistic judging "forces the judge to integrate many evaluation dimensions into a single number, which limits reproducibility"; decomposition raises inter-model agreement by ~0.45 and reduces variance; per-criterion isolation is one of the few determinism levers you have left after losing temperature=0. Merging spends it.

**The decisive reason it survives:** isolation is what makes the fix *possible*. Twelve independent readings of L183–L196 are twelve independent samples of a deliberately contradictory passage — deterministic code can compare them and **detect** the disagreement. That is a signal a monolithic call cannot produce even in principle, because it emits one reconciled story by construction. The plan currently generates this signal for free and throws it away. **The defect was never per-dimension isolation; it was isolation with no consumer for the redundancy it creates.** ADOPT #12, #13, #29 supply the consumer.

### Bet 3 — "Normalise: reported = round(raw / Σ active maxima × 100), with no special case for D4-off or D2-N/A."
**DID NOT SURVIVE. The transform is right; the three claims wrapped around it are false.**

Normalisation is correctly chosen and should be kept — every dimension max is corroborated 5–6× while "100" appears only as a derived aggregate, so normalisation is the only resolution preserving all stated relative weights, and Principle 6 already blesses rescaling. The typo hypothesis is dead on the same evidence.

**But "no special case" is false in both cases it names, and the bet is silent on a third that matters more.** D2-N/A has a written instruction ("redistribute weight to D3 and D4") that normalisation silently overrides — costing a demonstrated band flip (89.5 STRONG vs 90.5 ELITE, and 4.3 points the other way on the inverse). D4-off has a written denominator (85) silently replaced with 90 — bands disagree across a six-value raw window. And **cap ordering is unspecified**: applied in raw space, "Max 70 total" becomes reported 67 (AT RISK instead of INCONSISTENT). Three unstated decisions, each moving band boundaries by 3–5 points, all invisible in the output.

**The deeper reason it fails:** three readings are equally deterministic (normalise / clamp / re-weight), so the brief's actual core problem does not favour normalisation at all. The bet smuggles a **validity** choice in under a **reproducibility** banner — and normalisation is the only reading that leaves no visible artefact. Cheap to fix (ADOPT #35–#38), expensive to be asked about on camera.

---

## 6. TOP RISKS, RANKED

**R1 — Supabase Free pauses after 1 week; hard constraint #1 fails silently, days after the demo.**
No runtime workaround. *Mitigation:* $25 Supabase Pro for the grading window, stated on camera as a deliberate purchase. If staying Free, a **daily Vercel Cron** (allowed on Hobby) hitting an endpoint that runs a real `select` — **not** pg_cron, since whether internal cron queries count as "user activity" is undocumented (**low confidence**, no primary source either way).

**R2 — The verifier as designed generates false negatives on correct evidence.**
A single off-by-one line number floors a genuinely present behaviour. It fails in the direction that *looks like diligence*, which makes it the hardest bug to catch in your own demo, and it gets worse with transcript length — i.e. worst exactly where the bet is being defended. Compounded by em-dashes on up to 37% of lines in kickoff-01. *Mitigation:* ADOPT #17 (whole-transcript search, line number as hint) + #18 (four-rule normalisation) + #24 (keep-best). Log per-dimension verification pass rate as a headline metric.

**R3 — Opus 5 has thinking on by default, and reasoning models abstain measurably worse (~24% recall drop, no help from scale, prompting documented not to fix it).**
The one requirement the brief calls the point of the exercise is the one your model class is worst at. *Mitigation:* this is why ADOPT #21 (enumeration, never negation) is non-negotiable — it moves the negative out of the model entirely. Plus M6 (effort sweep on absence specifically) and M5 (the 10× D10 harness). Prompt wording alone will not close this.

**R4 — Wall clock does not fit 300s, discovered on day 4.**
12 Opus calls at ~18k input with adaptive thinking, plus the fact pass, plus retries, against a Hobby ceiling that cannot be raised. *Mitigation:* M4 on day 1, and the per-dimension-commit + lease design (#47, #46) which makes a split a config change rather than a rewrite. Plus `getDeadline()` self-abort (#48) so a timeout produces "7/12 scored, ran out of function time" rather than a generic sweep failure.

**R5 — Long-context degradation on the 65KB transcript, showing up as score VARIANCE.**
NoLiMa's 16K numbers are real and Opus 5 is not in the table; if it degrades the way Claude 3.5 Sonnet did (45.7 at 16K, effective length 4K), coaching-02 is the weak point in the whole build. It will manifest as exactly the reproducibility property you are graded on. *Mitigation:* M7 run on both coaching-02 (65KB) and kickoff-02 (15KB) and **compare variance between them** — that comparison isolates the length effect. If it shows, the sound fixes are per-dimension calls (already in), higher effort, and structured enumeration. **Not** chunking or retrieval, which trade a measurable accuracy problem for an unsound one.

**R6 — Prompt cache silently broken (per-dimension schemas ahead of the transcript, or OpenRouter routing scatter).**
Cost degrades to ~$1–2.50/run — affordable, so this is a cost risk not an architecture risk — but presenting cached pricing as fact before logging `cached_tokens` is an overclaim the grader can trivially falsify. *Mitigation:* M2, plus assert `cached_tokens > 0` on calls 2..N and fail loudly in dev.

**R7 — The report contradicts itself with evidence attached.**
D7=5/5 "anchor confirmed — L189" and, four pages earlier, "CAP FIRED: no accountability commitment — L189." **This is strictly worse than one wrong score:** a wrong score requires the grader to know the rubric; a self-contradiction requires him to read two paragraphs. *Mitigation:* ADOPT #12 (fact pass owns caps) + #29 (entailment table). Surface unresolved conflicts in the report rather than silently picking a side.

**R8 — Unpinned provider routing destroys reproducibility below your own stack, invisibly.**
Nine endpoints, three without `structured_outputs`, two accepting `temperature`. *Mitigation:* ADOPT #14 (`only:["anthropic"], allow_fallbacks:false, require_parameters:true`) + persist the resolved provider per row and mark any non-anthropic run non-comparable. Accept the availability trade and make sure the failure surface works.

**R9 — react-pdf hangs instead of throwing, burning the whole 300s.**
Known long-lived layout-bug family. *Mitigation:* ADOPT #60 (`Promise.race`, 45s, distinct `pdf_render_timeout` reason) + shallow document structure + #57 (day-1 deployed smoke test, not localhost).

**R10 — Scope creep disguised as rigour.** "No scope you were not asked for" is an explicit criterion, and the research surfaced a lot of buildable machinery. *Mitigation:* the ADOPT tiers above. The defensible line: **prompt caching** is in scope because it cannot alter a score (the model sees byte-identical input either way — state that invariance explicitly if challenged); the **stability report, cap inversion, evidence gate and entailment table** are in scope because they *are* the stated core problem; the **paraphrase and positional probes** are measurement of the core claim; **calibration, NLI, embeddings, multi-sample voting across all 12** are not. Say out loud which you declined and why — declined decisions score better than decisions never considered.

**R11 — Shipping a stably-wrong system and reporting it as a success.**
Reliability and validity dissociate (α=0.943 alongside 25% position flips). *Mitigation:* M8 — never present a determinism number without a paired correctness assertion.

**R12 — Hand-built lexical families validated on n=4 transcripts I can see.** Recall on an unseen transcript is unmeasured. *Mitigation:* the one-directional rule (#28), stated out loud before the grader states it for you. Ship the booking-state classifier (`proposed/completed/deferred/declined`, validated on exactly four calls — one per class) with its own confidence field and **show the timeline it built**, so a wrong classification is visible rather than silent. Label the turn-final em-dash as a **format-specific** convention of this synthetic corpus — a different vendor may use `...` or `[crosstalk]` or nothing.

**R13 — Storing full transcripts unencrypted behind a shareable link.** That is what the brief asks for. *Mitigation:* state it in the README as a deliberate accepted trade-off with mitigations named (128-bit CSPRNG token, **no enumeration surface** per #50, no search indexing). An unstated trade-off reads as an oversight; a stated one reads as judgement.