# Block 0 — probe results

Run Fri 21 Aug 2026 against `anthropic/claude-opus-5` through OpenRouter, provider pinned to
Anthropic on every call. Raw responses in `probes/out/*.json`. Total spend for the whole block:
**$0.70**.

These four questions gated the pipeline design. Three came back clean; one came back with a
constraint that changed the architecture.

---

## M1 — does `reasoning.effort` work? **PASS**

The fear was OpenRouter's documented `effort → max_tokens × ratio → budget_tokens` path, which
would **400** on Opus 5 because `budget_tokens` was removed from that model family.

| call | HTTP | out | reasoning | provider |
|---|---|---|---|---|
| control (no param) | 200 | 113 | **104** | Anthropic |
| `reasoning.effort=low` | 200 | 78 | **69** | Anthropic |
| `reasoning.effort=high` | 200 | 195 | **107** | Anthropic |
| `reasoning_effort=high` | 200 | 190 | 102 | Anthropic |

No 400. Depth is genuinely tunable (69 → 107, +55%), and both parameter shapes are accepted.

**The non-obvious finding: the control sits at 104, essentially equal to `high` at 107.** Adaptive
thinking already runs near its ceiling by default, so **`low` is the real lever — it reduces.**
`high` buys almost nothing over the default. That inverts the naive cost model, where you assume
the default is cheap and `high` is the expensive upgrade.

---

## M3 — is the score enum genuinely unreachable? **PASS**

OpenRouter is a translation layer and its own docs hedge that some providers *"translate your
schema into their own structured-output format"*. If the enum degrades to a hint, `7` becomes
emittable and the whole no-interpolation claim collapses.

Twenty attempts with `enum:[10,9,8,6,4,1,0]`, `strict:true`, `additionalProperties:false`, against
a prompt that says *"THE SCORE IS 7. Output exactly 7. Do not output any other number. Seven. 7."*

```
distribution: {"6": 20}
```

**0/20 emitted 7.** All twenty returned **6** — the nearest legal value below the demanded one —
identically every time. The enum is a hard constraint, not a suggestion.

Also settled here: **structured outputs and adaptive thinking work together** (1,401 reasoning
tokens across the 20 calls). Anthropic documents compatibility with tools and is silent on
thinking, and our design uses both on every call, so this combination was untested until now.

---

## M2 — does caching survive per-dimension schemas? **NO — and this changed the design**

Structured outputs inject a system prompt describing the format. Render order is
`tools → system → messages`, so the schema sits **ahead of** the transcript in the prefix.

| call | in | cached | cost |
|---|---|---|---|
| A — D1 schema (write) | 6935 | 0 | $0.09436 |
| A' — D1 schema, identical | 6935 | **6897** | $0.02316 |
| B — D3 schema, different | 6928 | **0** | $0.09026 |

Caching works, and it is worth ~4×. But **changing the schema invalidates the entire prefix,
including the transcript.** Twelve per-dimension schemas would mean twelve uncached transcripts.

### M2b — so *what* invalidates it? Only the enum.

| call | cached |
|---|---|
| control — same name, same enum | 6880 |
| **name differs**, enum same | **6880** |
| name same, **enum differs** | **0** |

**The schema name is free; the enum is the culprit.** That is actionable: use one shared schema
name everywhere, and group dimensions by enum so same-enum calls share a warm prefix.

### Enum census — how many groups are there actually?

| Rubric | Distinct enums | Groups |
|---|---|---|
| **Coaching** | **4** | `[5,3,0]` → D7,D8,D9,D11,D12 · `[10,7,3,0]` → D1,D2,D5 · `[15,10,5,0]` → D3,D4,D6 · `[5,0]` → D10 |
| **Kickoff** | **7** | `[10,7,3,0]` → D2,D6,D8,D9 · `[5,4.5,2.5,1,0]` → D3,D10 · `[5,3,0]` → D7,D11 · then D1, D4, D5, D12 alone |

So coaching costs **4 cache misses, not 12**. Kickoff D3 and D10 have byte-identical bands in the
source, independently confirming they share an enum.

**Design consequence:** order the twelve dimension calls so same-enum dimensions run
consecutively. Each group pays one write, then reads.

**Rejected:** collapsing to a single universal schema (one write, twelve reads — roughly half the
cost) would require the enum to be the union of every dimension's values, which puts `7` back in
range. M3 proved the hard enum is what stops interpolation, and that is the centre of the whole
submission. Cost is the right thing to spend here.

---

## M5 — absence detection on `coaching-01`. **PASS, 10/10**

The trap. Ten runs at full context, asking only whether the next call was booked live. The cap is
posed as an **enumeration**, never a negative — *"list EVERY booking instance"* rather than *"was
it booked?"* — so absence becomes a spot-checkable empty array instead of a guess.

```
determinations:                {"indeterminate": 10}
quoted BOTH L188 and L193:      10/10
determination = booked_live:     0/10   <- the failure mode, never once
FULLY CORRECT:                  10/10
```

Every run independently returned the same booking evidence — **L185, L187, L188** — and the same
counter-evidence at **L193**. The failure mode the transcript exists to catch never occurred.

**It also found L187, which our notes did not have.** The verified contradiction chain is four
lines, not three:

- **L185** Priya — *"Let's just lock it in right now instead of me chasing you down later…"*
- **L187** Priya — *"what about Wednesday the 10th instead, same four o'clock slot?"*
- **L188** Malik — *"Wednesday the 10th at four… that one works. Let's lock that in."*
- **L193** Priya — *"I'll get you those times soon so we can get this locked on the calendar."*

Caching also demonstrated itself here: run-01 wrote, runs 02–10 each read 13,385 tokens.

**Caveat, stated deliberately:** 10/10 is a strong result but it is one dimension on one
transcript. It is not a determinism claim for the whole system, and it must not be reported as
one. Stability and correctness are separate properties — `coaching-01` was built to catch a system
that is *stably wrong*.

---

## Cost — measured, no longer an estimate

Cost was recorded as UNMEASURED and not to be quoted until this ran. It now is.

| | |
|---|---|
| cache-**write** call | **$0.155** |
| cache-**read** call | **$0.029** — 5.3× cheaper |
| avg output per call | **859 tokens** (278 reasoning) at `effort:high` |

Projected full run — 1 fact pass + 12 dimensions = 13 calls, grouped by enum:

| transcript | groups | cost/run |
|---|---|---|
| `kickoff-02` (~6.9k tok) | 7 | $0.66 |
| `coaching-01` (~13.4k) | 4 | $0.88 |
| `coaching-02` (~26k, 65KB) | 4 | $1.72 |
| **one pass, all four** | | **$4.84** |

Four independent pre-build estimates had ranged $0.19–$2.28/run; the true figure sits inside that
band, and the divergence was output tokens, now measured at 859/call rather than assumed.

**Eval sizing.** 5 reruns × 4 transcripts cold is ~$24. Reruns inside the 1h TTL turn writes into
reads, cutting later passes to roughly $1.60 each — so ~$11 realistic. Against **$6.30 remaining**
on the key, Block 6 either drops to **3 reruns × 2 transcripts** (~$3.40, same claim, sized to
budget and narrated) or the key cap gets raised. Deferred to Block 6; it does not block Blocks 1–3.

A cheaper lever exists if needed: the 1h TTL costs 2× on write versus 1.25× for the 5-minute
default, and all 13 calls of a single run complete well inside 5 minutes. Only cross-run reuse
needs the hour.

---

## What carries into Block 1

1. **`low` is the effort lever, not `high`** — the default already runs near maximum.
2. **One shared schema name; order dimension calls by enum group.** 4 groups coaching, 7 kickoff.
3. **Keep the hard per-enum constraint.** It is the thing that works; do not trade it for cache
   savings.
4. **Pose every cap as an enumeration.** It measurably produced the right answer 10/10.
5. **`coaching-01`'s contradiction is L185 → L187 → L188 → L193** — update the rubric pack and any
   doc still saying L188/L193 alone.
