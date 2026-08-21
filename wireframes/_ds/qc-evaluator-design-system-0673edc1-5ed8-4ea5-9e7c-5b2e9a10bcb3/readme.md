# QC Evaluator — Design System

The design system for **QC Evaluator**, the Stage-2 call-scoring tool built for **BeaverMind**. One
product, one job: paste a coaching or kick-off call transcript, get back a scored report where every
number carries the verbatim lines it came from and the line number those lines sit at.

This is a working design system, not a brand deck: tokens, components, a full click-through
recreation of the app, and the rules that make the whole thing hold together.

---

## Sources this was built from

Everything here was read from material the user provided. Nothing was inferred from a screenshot
where code existed.

| Source | What it gave |
|---|---|
| **Attached codebase** `QC-EVALUATOR-DESIGN-SYSTEM/` (read-only mount) | The complete spec. `BRAND-SYSTEM.md` (384 lines — palette, icon grammar with every glyph path, component values, screen appendix), `README.md`, `assets/tokens.css`, and four source artboards under `artboards/` (`Main`, `Type`, `Icons`, `Components`). |
| `QC-EVALUATOR-DESIGN-SYSTEM/assets/` | Self-hosted Poppins 500/600/700 (latin subset, 23 KB), the logo set (mark, lockup, inverse, favicon), `icons.tsx` (31 typed React glyphs) and `icons.svg` (31-symbol sprite). All copied into `assets/`. |
| `QC-EVALUATOR-DESIGN-SYSTEM/reference-frames/` | 19 stills of the reference build being replicated, plus `MANIFEST.md`. Four of the load-bearing frames are copied into `reference/`. |
| Uploaded files (`uploads/`) | The same fonts, logos and icon files, uploaded separately. Identical to the codebase copies. |

**Provenance, stated plainly.** The palette and type ramp in the source spec were extracted from a
live third-party reference stylesheet (`acquisition.com`, six `/_next/static/chunks/*.css` bundles).
Hex values and an open-licence typeface only — no marks, wordmark, name or claim of affiliation.
Their `--color-charcoal-blue: #131628` became this system's brand. Their dominant accent,
`--color-electric-purple: #6F00FF`, was considered and **declined**; it stays on the record as a
struck-through swatch rather than being deleted.

**No logo was invented.** `assets/logo/` is the mark shipped with the source codebase — a citation
gutter: a vertical rule, two lines that align to it, and one that does not. The misalignment *is*
the product.

---

## The system in one page

**Ink and brand are the same value: `#131628`.** There is no accent colour, and that is the whole
idea. Emphasis has to come from weight, scale and surface — which leaves colour free to mean exactly
one thing: **band state**. When something on the page is coloured, it is reporting a score. The five
band hues are the only hues; a sixth is a bug.

```
--qc-paper #FAFAFA   --qc-raised #FFFFFF   --qc-sunk #F4F4F4
--qc-brand #131628   --qc-ink-muted 62%    --qc-ink-dim 38%
--qc-elite #1F9E6E   --qc-strong #455876   --qc-inconsistent #B8860B
--qc-at-risk #EF6B51 --qc-fail #F44336
```

**Type.** Poppins 600/700, display only — never below 20px, never above weight 700. System stack for
body and all dense UI. Mono for anything machine-measured. `font-variant-numeric: tabular-nums`
globally, non-negotiable in a scoring product.

**Geometry.** 6px controls · 8px surfaces · 16px panels · 999px state chips only. 4px spacing base.
1152px container, 68ch prose.

**Motion.** `.15s cubic-bezier(.4, 0, .2, 1)`, disclosure and progress only. No spinners.

### Three things that are requirements, not taste

1. **The layout must hold a contradiction.** The sample transcript agrees a meeting time at L188 and
   withdraws it at L193. Both lines have to be visible and the fact reported as *unverifiable*. This
   is why the cap notice has three states and not two.
2. **Absent is never zero.** `NOT EVIDENCED` / `N/A` / `INDETERMINATE` are distinct rendered states.
3. **Evidence carries its line number**, derived in code from where the quote was found — never
   taken from the model — and rendered as the *original* span, never a normalised one.

---

## CONTENT FUNDAMENTALS

**The voice is a forensic one.** Copy in this product reports what was found and what could not be
found. It does not encourage, congratulate, or soften. The reader is a QC reviewer deciding whether
to trust a score, so the writing's job is to make its own limits legible.

**Casing.** Sentence case everywhere in prose and on controls — `Run evaluation`, `Download PDF`,
`Retry this run`. ALL CAPS is reserved for two things: mono micro-labels that name a region
(`EVIDENCE`, `QUICK FIX`, `THE ONE THING`, `TWELVE DIMENSIONS`) and machine states
(`FIRED`, `INDETERMINATE`, `NOT FIRED`, `NOT EVIDENCED`, `N/A`, `EVIDENCE_NOT_FOUND`). Never Title
Case On A Heading.

**Person.** Third person about the call and its participants — "Priya diagnosed accurately", "Malik
left clear on what to change". Second person only inside a quick fix, where the reader is being told
what to do next: *"Say the date and time out loud, then ask for a verbal confirmation."* First person
never appears; the system does not have a personality.

**Tense and mood.** Past tense for findings, present for rules, imperative for fixes. Declarative
sentences; no rhetorical questions except the one diagnostic test the system asks of itself
(*"could a person have disagreed with it?"*).

**Numbers are always exact and always qualified when they are estimates.** `66.6%` not "about
two-thirds". When a measurement is an approximation of a rule stated in different units, the copy
shows its interval: `Coach talk-share 66.6% (63.1–70.4% at r=0.8–1.2) — below 75% on every reading.`
The phrase *"on every reading"* is doing real work: it says the conclusion survives the uncertainty.

**Say what you cannot do.** This is the most distinctive habit in the voice.
*"Next call booked live — cannot be verified. L188 agrees a time; L193 withdraws it. Scored the
unverified branch: D10 → 0/5."* Three moves in three clauses: state the limit, show both sides,
name the branch you scored. Never hedge with "may", "possibly", or "it appears that".

**Failure copy names the code and then explains it in English, in the same frame.**
*"Two quotes about the next call were located and both verified against the transcript, and they
contradict each other. The dimension cannot be scored from evidence, so it was not guessed."*
A failure that only says "failed" is a bug.

**Em dashes are used, and used deliberately** — the source spec is full of them and they carry the
system's habit of appending the qualification to the claim. Semicolons for paired facts that
contradict. Avoid exclamation marks entirely.

**No emoji. Anywhere.** They render differently per platform and cannot take `currentColor`, which
disqualifies them as glyphs; and the tone would not survive one.

**Words this system does not use:** *insights*, *powerful*, *seamless*, *leverage*, *unlock*,
*journey*, *AI-powered*, *smart*. Also avoid *just*, *simply* and *of course* — they imply the reader
should have found it obvious.

**Length.** A dimension's reasoning is one to three sentences. The brief is one paragraph, five
sentences at most, and its last sentence names the consequence. Micro-labels are one to three words.

---

## VISUAL FOUNDATIONS

**Colour.** Three surface values (`paper` / `raised` / `sunk`) do all the structural work. Brand and
ink are one value at four strengths: full for headings, numerals, line numbers and the primary button
fill; 62% for body copy; 38% for captions and disabled; 6% for chip and notice fills. The five band
hues are the only other colours, and they are allowed on exactly four things: score chips, the band
rail, cap notices and status glyphs. Never on decoration, hover states or borders.

**Type.** Three faces, one rule — **mono for anything machine-measured, sans for anything judged**,
Poppins for display. Scores, line numbers, talk-share, cap ids, hashes and timestamps are mono;
reasoning, briefs, quick fixes, red flags and quoted speech are sans. The test for any new element:
*could a person have disagreed with it?* If yes it is sans; if it fell out of arithmetic or a string
match it is mono. Display steps are 80/700/−.05em (score numeral), 52/600/−.04em (page title),
26/600/−.025em (the one thing).

**Spacing.** 4px base: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64. Nothing off-scale, nothing between steps.
Section breaks are `margin-top: 40px; padding-top: 30px; border-top: 1px solid --qc-rule`.

**Backgrounds.** Flat `--qc-paper`. **No imagery of any kind** — no photography, no illustration, no
pattern, no texture, no grain, no full-bleed hero. The landing page has no hero image at all; it
opens with left-aligned type on paper. There is nothing in this system that could be described as a
gradient background.

**The one permitted gradient** is functional, not decorative: a collapsed dimension row fades out
under a 26px `linear-gradient(to bottom, rgba(255,255,255,0), #FFFFFF)` mask instead of truncating
with an ellipsis. That is the complete list of gradients.

**Shadows: none.** Not on cards, not on hover, not on the app bar, not on a dropdown. Depth comes
from surface value plus a 1px rule. `--qc-rule` (10%) for dividers and card borders; `--qc-rule-strong`
(18%) for button outlines, the evidence gutter rule and inactive rail segments.

**Cards.** `--qc-raised` fill, `1px solid --qc-rule`, 8px radius, no shadow. A card that needs
attention gets a **left border** — `3px solid <state>` on cap notices — and a 6% state tint, never a
lift. Dashed borders mean *the value is missing rather than measured*: the `not-evidenced` chip and
the unobservable-criterion notice both use `1px dashed --qc-rule-strong`.

**Corner radii carry meaning.** 6px on controls and inputs · 8px on surfaces and notices · 16px on
large panels · 2px on band-rail segments · 999px on state chips **and nothing else**. A pill-shaped
button is wrong in this system.

**Animation.** One curve, `cubic-bezier(.4, 0, .2, 1)`, and one duration, `.15s` (`.22s` for
disclosure: the chevron rotates 90° and the row expands). Permitted: disclosure and progress.
Banned: scroll animation, fade-in on load, parallax, hover lifts, and spinners — progress is a
twelve-row manifest that fills in, because a spinner is what you use when you have nothing to report.
The `scoring` glyph is a static open arc; it does not rotate.

**Hover states** change colour only, never position or scale. Primary button darkens to
`--qc-brand-hi` `#252854`; secondary's border goes from `--qc-rule-strong` to full `--qc-brand`;
ghost's label goes from `--qc-ink-muted` to full `--qc-brand`; a card's border steps from `--qc-rule`
to `--qc-rule-strong`. **Press states** darken further with no transform — nothing shrinks, nothing
bounces. Disabled is `opacity: .4`, never a different colour. Focus is a 2px `--qc-brand` outline at
2px offset.

**Transparency and blur.** Transparency is used only as a tint of the ink or a band colour (6%, 12%,
14%, 18%, 38%, 62%) — never as a translucent panel over content. **Blur is never used.** No
glassmorphism, no frosted headers; the sticky app bar is opaque `--qc-paper` with a hairline rule.

**Layout.** Left-aligned, single column, 1152px container, 32px page gutters. Prose caps at 68ch,
cited speech at 62ch. The evidence gutter is a fixed 42px column. Fixed elements: the 48px app bar
(sticky, hairline bottom rule) and the report's right-hand jump rail (sticky at 76px). One filled
button per screen — everything else is hairline or plain text. No centred heroes, no competing CTAs.

**Imagery colour vibe.** Not applicable, and deliberately so: there is no imagery. If a product
surface ever needs one, the only correct treatment is a flat `--qc-sunk` placeholder that says what
is missing.

---

## ICONOGRAPHY

**One set, 31 glyphs, shipped with the source and copied in whole.** `assets/icons/icons.tsx` is the
original typed React file (31 components); `assets/icons/icons.svg` is the same set as a 31-`<symbol>`
sprite for non-React use. `components/icon/Icon.jsx` is the design system's own wrapper over the
identical path data, so a consumer can write `<Icon name="contradiction" />`.

**Construction rules — all six, every glyph.** 24×24 viewBox · 1.25px stroke, fixed · endpoints snap
to a 1.5px grid · round caps and joins · `fill: none`, no exceptions · `currentColor`.

`fill="none"` and `stroke="currentColor"` are a **pair** — drop either and the glyph renders as empty
space with no console error and nothing in the network tab. The `Icon` wrapper sets both so you
cannot hit it.

**Why 1.25 on 24 and not the 1.5-on-20 every library ships.** Weight comes from *size*, not stroke.
A finer line on a larger grid reads more precise while keeping the same visual mass. Below 1.1px the
line breaks up at 16px, which is why 1.25 is the floor.

**Sizes are contextual.** 24px stacked on a rubric card · 18px in a dimension or progress row (10px
gap to text) · 16px inside a button at stroke 1.6 (9px gap) · 14px beside a micro-label (8px gap).

**Status glyphs take their band or semantic colour:** `verified` → `--qc-elite`; `failed` and
`cap-fired` → `--qc-fail`; `indeterminate` → `--qc-brand`; `degraded` → `--qc-inconsistent`;
`not-applicable` / `queued` / `not-evidenced` → `--qc-ink-dim`.

Two glyphs are load-bearing and worth knowing:

- **`contradiction`** — two opposing arrows on offset baselines, deliberately *not* crossing.
  Crossing would read as "cancelled"; offset and opposed reads as "these two point different ways
  and both are on the record", which is exactly what the report has to say. No icon library ships a
  glyph for *"these two lines contradict each other."*
- **`indeterminate`** — a question glyph in brand navy, **not** a warning triangle. It means the
  system looked and could not verify, which is different from something being wrong.

**No emoji, no dingbats, no unicode characters standing in as icons.** Two unicode marks appear as
*typography*, not iconography: `⌘K` in the search field's keyboard hint and `→` in a ghost `Run →`
action. No second icon library — mixing two is the tell of an assembled UI. No filled or duotone
variants. An icon labels a control or a state; if the glyph could be removed and the element would
still be understood, remove it.

---

## Index

### Root
| File | What it is |
|---|---|
| `readme.md` | This file — context, sources, content and visual foundations, iconography, index. |
| `SKILL.md` | Agent-Skills front matter so this folder works as a downloadable Claude Code skill. |
| `styles.css` | The one file consumers link. `@import` lines only. |
| `thumbnail.html` | Homepage tile for the design system. |

### `tokens/`
`fonts.css` (self-hosted Poppins `@font-face`) · `colors.css` · `typography.css` · `geometry.css` ·
`motion.css` · `base.css`. All reachable from `styles.css`.

### `assets/`
`logo/` — `qc-mark.svg`, `qc-mark-inverse.svg`, `qc-lockup.svg`, `qc-lockup-inverse.svg`,
`favicon.svg` · `icons/` — `icons.tsx` (31 React glyphs), `icons.svg` (31-symbol sprite) ·
`fonts/` — `poppins-{500,600,700}-latin.woff2`.

### Components
Ten exports across six directories. This is the source's own inventory — the families defined in
`BRAND-SYSTEM.md` Part Three plus the rubric card from the reference frames. Nothing else was added.

| Component | Directory | What it is |
|---|---|---|
| `Icon` | `components/icon/` | The one glyph primitive; 31 names. Also exports `QC_ICONS`. |
| `Button` | `components/controls/` | Primary / secondary / ghost, three sizes. |
| `Input` | `components/controls/` | Single-line field, 40px, sunk fill. |
| `ScoreChip` | `components/scoring/` | Seven band states. Also exports `bandFor(score)`. |
| `BandRail` | `components/scoring/` | Five-segment rail; replaced the gauge. |
| `EvidenceCitation` | `components/evidence/` | Cited quote with gutter line number; contradiction and degraded variants. |
| `CapNotice` | `components/evidence/` | Cap in three states — `FIRED` / `INDETERMINATE` / `NOT_FIRED`. |
| `UnobservableNotice` | `components/evidence/` | Criterion the format cannot show. |
| `ProgressRow` | `components/progress/` | One row of the twelve-row manifest; four states. |
| `RubricCard` | `components/rubric/` | Call-type chooser — two cards, not a dropdown. |

Each directory carries a `@dsCard` HTML showing its states, and each component a `.d.ts` props
contract and a `.prompt.md` usage note.

**Intentional additions.** One: `Icon`. The source ships 31 glyphs as a flat list of named React
components and an SVG sprite, with no single primitive. A wrapper was needed so consumers get one
call signature and cannot drop the `fill`/`stroke` pair.

### `ui_kits/qc-evaluator-app/`
The product, recreated as a four-screen click-through: `LandingScreen` · `RunFormScreen` ·
`ProgressScreen` · `ReportScreen`, with shared `AppChrome`. `index.html` runs it; `data.js` holds
the `coaching-01` sample run. See that folder's `README.md` for what was recreated and where it
deliberately diverges from the reference build.

### `templates/qc-report/`
A starting folder for a new report page, wired to this system's stylesheet and bundle.

### `guidelines/`
Eighteen specimen cards feeding the Design System tab — Brand (5), Colors (5), Type (4), Spacing (4).

### `reference/`
Four of the 19 reference stills plus `MANIFEST.md`, kept so a reader can check the recreation against
the record. `frame_0057` establishes the icon language; `frame_0069` is the cleanest full report.

---

## Still outstanding

Low-fi wireframes for the four screens, and the PDF export (A4 794×1123 @96dpi, 12pt minimum body,
server-rendered). The palette carries over unchanged — a hueless brand needs no print variant — but
react-pdf has no CSS grid and no gradient masks, so the band rail must be rebuilt as flex
percentages and collapsed text truncated by character count.
