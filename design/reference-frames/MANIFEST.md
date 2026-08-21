# Reference frames — the build being replicated

Scene-extracted stills from the exercise briefing video (8:33). The video file itself is gone;
**these are the only surviving record of the reference build.**

**There are only two pages** — a run page and a report page. The eight frames here are those two
pages in eight distinct states (scroll position, disclosure, panel open). Curated down from a
19-frame contiguous grab; what was dropped and why is at the bottom.

The picture-in-picture webcam bottom-left is the presenter, not part of the UI.

---

## Run page — 2 frames

| Frame | State | What it establishes |
|---|---|---|
| `frame_0059` | full form | `Run an evaluation` + sub, hairline divider, `COACH` / `CLIENT` / `PROGRAM (OPTIONAL)` labels in tracked small-caps, input treatment (near-white fill, hairline, ~8px radius, search glyph left, chevron right), four call-type cards, mock-data footnote in mono |
| `frame_0057` | cards, close | **The icon language.** Four cards legible: thin uniform stroke, no fill, geometric, low-contrast grey, ~20px, centred above label with a ghost `Run →`. Sales = trending arrow · Kick-off = play triangle · Coaching = speech bubble · Strategic review = diamond. **Our entire icon set derives from this frame.** |

## Report page — 6 frames

| Frame | State | What it establishes |
|---|---|---|
| `frame_0069` | full page | The canonical view. `← Back`, breadcrumb `FULL ANALYSIS   COACHING CALL` (space-separated, no slash), H1 + "Coached by", three top-right actions, pull-quote, brief, cap pill, gauge, right-rail nav, first dimension rows |
| `frame_0061` | header, zoomed | Pull-quote at readable size — same sans, medium weight, **not** a serif. Cap pill: pale pink fill, red text, ~11px, `⊳` glyph, inline width |
| `frame_0064` | gauge + rail | Semicircular red arc, `67` large navy + `/100` small, `AT RISK` beneath. Rotated `COACHING` label over ~12 tick marks. **Score-chip colour range** across several rows |
| `frame_0063` | dimension list | Multiple collapsed rows — boxed index, title, `★` flag, right-aligned chip, chevron. Collapsed reasoning **fades under a gradient mask** rather than truncating with an ellipsis |
| `frame_0065` | row expanded | reasoning → `EVIDENCE` micro-label → italic quotes with thin left rules → `QUICK FIX` boxed on pale tint |
| `frame_0067` | row + feedback | The `YOUR FEEDBACK` panel — chip grid, rationale textarea, suggested-score input, `AI: 7` readout. **Luke on camera: "please ignore your feedback section."** Kept as the visual record of a feature we deliberately cut |

---

## What the frames establish

**Chrome, every page.** ~48px bar, hairline bottom rule. `≡` · angular wordmark · "QC Evaluator"
grey · centred pill search with `⌘K` · theme icon · `14:37 EDT` · green dot + `LIVE` · avatar.
Everything low-contrast except the wordmark.

**Icon grammar** (`0057`): outline only, no fills, thin uniform stroke, geometric, centred, low
contrast. Icons label a control; they never decorate. The most transferable thing here.

**One filled button per page.** `⬇ Download PDF` is dark-filled; `▶ Watch recording` is ghost.

**Fired caps are first-class** — a pill above the dimension list, never buried in a number.

## Where we deliberately diverge

| Reference | Ours | Why |
|---|---|---|
| Evidence quotes, no line numbers | **Line number in the gutter** | Quotes are verified against the source by position; showing it makes the verification visible |
| Semicircular gauge | **Band rail** | Shows band *structure* and distance-to-next-band, not just the number already printed |
| Four call types | **Two** | Luke: sales call and strategic review *"can be ignored"* |
| `YOUR FEEDBACK` panel | **Omitted** | Luke: *"please ignore"* |
| Cap = fired / not fired | **Three states** | A boolean cannot describe `coaching-01`, where a booking is agreed at L188 and withdrawn at L193 |
| Poppins everywhere at 800 | **Display only, ≤700** | Mass makes a round geometric face bulge; presence comes from size and tracking |

---

## Dropped, and why

Eleven frames were removed from the original grab. Recorded so the curation is visible rather
than looking like frames went missing:

| Dropped | Reason |
|---|---|
| `0054` `0055` `0056` | **Pure talking head — no UI at all.** Presenter mid-sentence. Should never have been in a folder of page references |
| `0072` `0073` `0076` | Report page **behind his deliverable overlays** ("1 Public GitHub repo", "2 Live Vercel link", "3 Loom, webcam on"). App partly obscured |
| `0062` | Report mid-scroll, **left edge cropped** |
| `0058` `0068` `0078` `0060` | Near-duplicates of `0059`, `0067`, `0069`, `0069` respectively |
