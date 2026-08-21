# Facts I verified myself (2026-08-20/21) — for OPTIONS.md

## Platform limits (web-verified today)
- Vercel Hobby + Fluid compute: **300s max function duration** (was 60s legacy). `waitUntil` IS
  supported for background work after the response is sent. [vercel.com/docs/functions/limitations,
  vercel.com/docs/fluid-compute]
- Vercel Cron on **Hobby: ONCE PER DAY MAXIMUM**. More frequent expressions FAIL AT DEPLOY TIME
  ("Hobby accounts are limited to daily cron jobs"). Timing only guaranteed within the hour.
  => A Vercel-Cron-driven queue worker is NON-VIABLE on the free tier for this exercise. Decisive.
  [vercel.com/docs/cron-jobs/usage-and-pricing]
- Supabase free: **pg_cron enabled by default on every project**; pgmq queues available;
  **Edge Functions free plan max duration 150s**, CPU time 2s/request, idle timeout 150s.
  => If you want queue+worker, the scheduler must be Supabase pg_cron, NOT Vercel Cron.
  [supabase.com/docs/guides/functions/limits, supabase.com/docs/guides/cron]

## Anthropic API (from the bundled claude-api skill, authoritative over recall)
- **temperature / top_p / top_k are REMOVED on Opus 5, Sonnet 5, Opus 4.7/4.8, Fable 5 — they
  return a 400.** "Set temperature=0 for determinism" is NOT AVAILABLE on current frontier models.
  Sampling knobs still exist on Opus 4.6 / Sonnet 4.6 and older only.
- Structured outputs: `output_config: {format: {...}}` on messages.create (the old `output_format`
  param is deprecated). Recommended path is `client.messages.parse()` which validates against the
  schema. Incompatible with document `citations` (400).
- Strict tool use: `strict: true` as a TOP-LEVEL field on the tool definition (not on tool_choice);
  requires `additionalProperties: false` + `required`. Guarantees tool_use.input validates exactly.
- Models: opus-5 1M ctx $5/$25 per MTok; sonnet-5 1M ctx $3/$15 ($2/$10 intro thru 2026-08-31);
  haiku-4-5 200K ctx $1/$5. Thinking adaptive by default on Opus 5; depth via output_config.effort
  (low/medium/high/xhigh/max).
- Prompt caching: prefix match, render order tools -> system -> messages. Min cacheable prefix
  ~1024 tokens, max 4 breakpoints. Verify with usage.cache_read_input_tokens.
  Cache write 1.25x input (5-min TTL) / 2.0x (1-hour TTL); **cache read 0.10x input**.
  Note the 2026 default TTL change to 5 minutes.
- Batches API: 50% cost, async — relevant to B4/B6 cost but adds latency.
- Prefill is REMOVED on Opus 5 / Sonnet 5 / 4.6+ (400). Cannot force JSON by prefilling "{".

## Transcript facts (computed / read directly)
- Deterministic talk-share from `[Name]: text` word counts:
    kickoff-01  Dana Whitlock  67.53%  (74 turns / 3996 words) vs Owen Brandt 32.47%
    kickoff-02  Ivan Petrov    73.09%  (64 turns / 1909 words) vs Renata Cruz 26.91%  <-- ONLY file
                                                                over a threshold (>70% kickoff)
    coaching-01 Priya Raman    66.56%  (98 turns / 4042 words) vs Malik Osei  33.44%
    coaching-02 Marcus Reid    63.47%  (175 turns/ 6913 words) vs Hannah Vogel 36.53%
  All four files parse 100% cleanly: 0 non-matching non-blank lines, exactly 2 speakers each,
  near-alternating turns. The format is perfectly regular — deterministic parsing is safe.
- coaching-01 booking contradiction, exact lines:
    185 Priya: "Let's just lock it in right now instead of me chasing you down later..."
    188 Malik: "Wednesday the 10th at four, yeah, I'm off that day, that one works. Let's lock that in."
    193 Priya: "...Alright, go get some rest, I'll get you those times soon so we can get this
               locked on the calendar."
- coaching-02 books CORRECTLY and live: 309 link dropped in chat -> 313 "Go ahead and grab it" ->
  314 "booking it now... there, done, it's booked" -> 315 "I see it come through... We're locked in."
- coaching-02 line 129 (Marcus): "we're not due a full diagnostics review this cycle, that's usually
  a bigger milestone thing... so today isn't about screen-sharing footage and picking it apart,
  today's more about the strategy and the belief side of things."
  -> establishes D2 N/A **and** D4 disabled on the SAME transcript.
  Line 130 (Hannah): "I did wonder for a second if I was meant to have filmed something." (no video)
  Line 226 "your video's completely stuck" is a CONNECTION GLITCH, not movement video review.
- kickoff-01 is the clean Elite reference: books live (130-134), resolves Mountain/Pacific out loud,
  sends the invite during the call, structured recap at 136, assigns diagnostics live at 142.
  Fully self-consistent — no contradiction anywhere.
- kickoff-02 never books, but CONSISTENTLY so: 112 "my assistant handles the scheduling on that
  side, so she'll reach out", 114 "I'll just send you a link once we're a couple weeks in."
  Thin, not contradictory.

## Rubric arithmetic (checked)
- Kick-off dims: 10+10+5+15+10+10+5+10+10+5+5+5 = **100 exactly**.
- Coaching dims: 10+10+15+15+10+15+5+5+5+5+5+5 = **105**. Doc states 100 (D4 active) / 85 (disabled).
  Eleven non-D4 dims = 90, not 85. 5-point defect.
- With BOTH D2 N/A and D4 disabled (coaching-02): active max = 105 - 10 - 15 = **80**. Neither the
  stated 100 nor the stated 85 is reachable. And the D2 rule says "redistribute weight to D3 and D4"
  — but D4 is the disabled one. The instruction is unexecutable as written.
- D4 disable block prose lists FIVE exclusions ("no in-call demonstration" among them) but the
  numbered "Detection criteria — ALL four must be absent" list has only FOUR. Prose/list mismatch.
- Token estimate: 65,146 chars ~= 16-17K tokens; coaching rubric 32,420 chars ~= 8K tokens.
  So rubric+transcript in one call ~= 25K input tokens. Estimate, not measured with count_tokens.
