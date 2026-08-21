# Eval report

Measured, not asserted. Every number below came from a real run against the fixtures; where a
claim is not measured it says so.

Total API spend for the entire build, probes included: **$8.16**.

---

## 1. Determinism — 11/12, and the one that moves is named

> **Check this yourself: `npm run evidence`.** It recomputes every figure in this section, and in
> §2 and §2b, straight from the raw API responses in `probes/out/` and `eval/out/` — which are
> committed for exactly that reason. It prints the source file beside each number and exits
> non-zero if any of them stops matching this write-up.
>
> Counted honestly, that is **32 repeated Opus measurements** for the system that ships (20 + 10
> at the level of a single scored question, plus 2 full end-to-end runs) and **25 Sonnet
> measurements** that exist only to justify rejecting it. Adding those into one number would
> overstate what has been measured about the thing being submitted.

Two runs of `coaching-01`, **identical code on both sides**, inside the 1-hour prompt-cache
window.

| | run 1 | run 2 |
|---|---|---|
| dimensions identical | — | **11 / 12** |
| the one that moved | D12 **5/5** | D12 **3/5** |
| total | 95/100 | 93/100 |
| band | ELITE | **ELITE** |
| caps | 6 determinations | **6/6 identical** |
| fabricated quotes | 0 | 0 |

**What actually moves.** Not the score choice — the *contradiction judgement*. In run 2 the
model marked one D12 requirement as having both supporting and contradicting evidence; the
top-bucket gate then correctly refused the top value, and a binary flip became a two-point swing.
So the residual instability is one borderline call about what counts as counter-evidence, which
the gate amplifies.

That it lands on **D12 — "Structure & Time Management"** is not a coincidence. D12 is the only
dimension carrying a criterion no transcript can settle (the SOP minute targets; there are zero
timestamps in any fixture). The instrument is weakest exactly where the wobble is.

**Not claimed:** that this is the system's determinism figure. It is one transcript, two runs.
A fuller figure needs more runs across more transcripts and was not affordable — see §5.

**Deliberately not quoted:** the reference system's "≤1–2% fluctuation". That ran at
temperature 0.0, which does not exist on Opus 5 — the parameter was removed from the model
family. Determinism here is engineered instead: fixed enums, arithmetic in code, evidence
gating, content-hash idempotency.

---

## 2. The trap — `coaching-01`, caught every time

The call is warm by construction. At **L185** the coach says *"Let's just lock it in right now"*;
**L187/L188** agree Wednesday the 10th at four; then at **L193** she says *"I'll get you those
times soon so we can get this locked on the calendar."* Coaching D10 is `0/5 non-recoverable` if
the next call was not booked live.

| | result |
|---|---|
| Probe M5, D10 asked 10× at full context | **10/10 `indeterminate`**, both L188 and L193 quoted, `booked_live` **0/10** |
| Full scoring runs | booking cap `indeterminate` in **every** run; D10 scored **0/5** |

The cap reports three states, quotes both sides, and names the branch it scored. A boolean could
not have expressed this call.

---

## 2b. Why Opus and not Sonnet — measured, for $0.12

Sonnet 5 is **2.5× cheaper** ($2/$10 per MTok against Opus's $5/$25) and OpenRouter serves it
from the same nine-endpoint shape, so price and plumbing both favour it. Before switching, the
two claims the submission rests on were re-measured on Sonnet with identical prompts, schema and
provider pin. Only the model id changed.

| gate | Opus 5 | Sonnet 5 |
|---|---|---|
| enum is a hard constraint | **0/20** escaped | **0/20** escaped ✅ |
| …and the value it settles on | **6**, twenty times out of twenty | scattered across **five** values: 0, 6, 8, 9, 10 |
| catches the `coaching-01` trap | **10/10** `indeterminate`, both lines | **0/5** ✗ |
| said the call was booked | **0/10** | **4/5** |

**Sonnet never once found L193.** All five runs cited L185/L187/L188 — the moment the time is
agreed — and stopped there, concluding the next call was booked. It never reached the line five
turns later where the coach says *"I'll get you those times soon so we can get this locked on the
calendar."*

That is exactly the failure `coaching-01` exists to catch, and the transcript caught it. The
constraint machinery is model-independent — Sonnet honours the enum perfectly — but the
**reading** is not. What the cheaper model loses is not format compliance, it is noticing that
the close contradicts itself.

The enum result carries a second signal worth naming: obeying a constraint and being stable
inside it are different properties. Sonnet stayed in range every time and still picked five
different answers to the same question.

**Decision: stay on Opus 5.** The cost is real and accepted. This is the measurement that
justifies it, rather than an assumption that the expensive model must be better.

---

## 3. Guessing, both directions

A system that guesses fails two ways: it inflates a likeable call, and it invents depth in a
thin one. Both were measured before the prompts were frozen.

| | `coaching-01` (warm) | `kickoff-02` (thin) |
|---|---|---|
| total | **93–95/100 ELITE** | **50/100 FAIL** |
| citations | 127–129, all verified | 55, all verified |
| fabricated | **0** | **0** |

**A 43-point spread**, so no uniform inflation. And on the thin call `kickoff-02` D8 returned
**0/10 with 7 of 7 required behaviours not evidenced** — it declined to manufacture
coaching-intelligence questions that were never asked, rather than crediting the coach for
sounding competent.

---

## 4. Evidence integrity

**Zero fabricated quotes across 256 citations** in the two determinism runs, and zero across
every run in this report.

The verifier treats **the quote as the key and the line number as a hint**: it searches the
normalised quote across the whole transcript, maps the match back to the original span, and
derives the line in code. The naive design — checking the quote against the line the model
cited — floors a dimension whenever the model is off by one, which is a false negative *in the
direction that looks like diligence*.

Independently checked by `scripts/validate-report.ts`, which re-derives every citation from the
transcript:

> *ok — every quote is in the transcript, on the line it claims, attributed to the speaker of
> that line, at least 8 words long, and the arithmetic closes.*

---

## 5. What was not measured, and why

- **`coaching-02` and `kickoff-01` were never scored end to end.** Budget. `coaching-02` is the
  65 KB transcript that fires D4-disabled and D2-N/A together, so the D-02 denominator rule is
  proven by unit test rather than by a live run. That is a real gap.
- **Determinism is one transcript, two runs.** 5 reruns × 4 transcripts costs ~$24 against a $10
  budget. Sized to what was affordable and stated rather than quietly run smaller.
- **The contradiction-flagging instability in §1 is diagnosed but not fixed.** The likely
  refinement — requiring a contradiction to be material (counter-evidence at least matching
  supporting) before it blocks the top bucket — is unverified, and shipping an unverified fix to
  the thing this report measures would be worse than naming it.

---

## 6. Cost — measured

| | |
|---|---|
| cache-**write** call | $0.155 |
| cache-**read** call | $0.029 (5.3× cheaper) |
| average output | 859 tokens/call at `effort:high` |
| full run, `coaching-01` | **$0.64–0.80** |
| full run, `kickoff-02` | $1.48 |
| synthesis (one extra call) | $0.18 |

Four independent pre-build estimates spanned $0.19–$2.28 per run. The truth sits inside that
band; the divergence was output tokens, now measured.

Runs are grouped by score enum so same-enum dimensions share a warm transcript — coaching pays
**4 cache misses, not 12**. A single universal schema would halve the cost again but requires the
enum to be the union of every dimension's values, which puts the excluded values back in range.
Probe M3 fired 20 adversarial attempts at an excluded value and got **zero**; that guarantee is
worth more than the saving.

---

## Reproducing

```
npm test              # 83 unit tests
npm run worker-check  # run lifecycle, idempotency, stale-worker sweep — no API cost
npm run score -- coaching-01
npm run synth -- coaching-01
npm run e2e   -- coaching-01   # start -> worker -> contract, plus a determinism diff
npm run report                 # validate every citation, then render the page
```
