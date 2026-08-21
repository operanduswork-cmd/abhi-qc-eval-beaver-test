
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
