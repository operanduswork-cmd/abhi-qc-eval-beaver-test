# Graph Report - BEAVER-1ST TEST  (2026-08-21)

## Corpus Check
- 26 files · ~157,627 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 33 nodes · 33 edges · 8 communities (5 shown, 3 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.88)
- Token cost: 251,475 input · 5,937 output

## Community Hubs (Navigation)
- Backend Architecture & Scoring
- Report UI & Evidence Display
- Coaching Rubric & Transcripts
- Project Brief & Source Corpus
- Kick-off Rubric & Domain Canon
- Icon System
- Expanded Row Evidence
- Feedback Panel (cut from scope)

## God Nodes (most connected - your core abstractions)
1. `Backend Handoff` - 8 edges
2. `BeaverMind Stage 2 — Braindump` - 7 edges
3. `Design System: Components` - 5 edges
4. `Kick-off Call Scoring Rubric` - 5 edges
5. `Coaching Call Scoring Rubric` - 4 edges
6. `Design System: Palette` - 3 edges
7. `Scoring Pipeline Logic` - 3 edges
8. `Call Evaluation Exercise README` - 3 edges
9. `BeaverMind Stage-2 — call QC evaluator` - 2 edges
10. `Kick-off Rubric` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Design System: Components` --semantically_similar_to--> `UI Screenshot: Full Report Page`  [INFERRED] [semantically similar]
  design/Components.dc.html → design/reference-frames/frame_0069.jpg
- `Design System: Palette` --semantically_similar_to--> `Reference Frame: Run Page`  [INFERRED] [semantically similar]
  design/Main.dc.html → design/reference-frames/frame_0059.jpg
- `UI Screenshot: Full Report Page` --references--> `Call Evaluation Exercise README`  [INFERRED]
  design/reference-frames/frame_0069.jpg → README.md
- `QC Evaluator UI Screenshot - Overview` --references--> `Coaching Call Scoring Rubric`  [INFERRED]
  design/reference-frames/frame_0064.jpg → rubrics/coaching-call-rubric.md
- `BeaverMind Stage 2 — Braindump` --references--> `Coaching Transcript 01 (Malik Osei)`  [EXTRACTED]
  BRAINDUMP.md → exercise-source/coaching-01.txt

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Scoring Determinism Flow** — scoring_pipeline, exercise_source_coaching_01, exercise_source_coaching_rubric, handoff_backend [EXTRACTED 0.90]
- **Design System Evolution** — design_main, design_components, design_icons, design_reference_frames_frame_0057, design_reference_frames_frame_0059 [EXTRACTED 0.95]
- **Halden Method Phases** — halden_method, rubrics_kickoff_call_rubric, rubrics_coaching_call_rubric [EXTRACTED 1.00]
- **Call Evaluation System Components** — readme, rubrics_coaching_call_rubric, rubrics_kickoff_call_rubric, design_reference_frames_frame_0064 [INFERRED 0.90]
- **Adversarial Test Suite** — exercise_source_coaching_01, exercise_source_coaching_02, exercise_source_kickoff_02 [EXTRACTED 1.00]
- **BeaverMind Design System Implementation** — design_main, design_components [EXTRACTED 1.00]
- **Scoring Determinism Strategy** — scoring_pipeline, determinism_boundary, handoff_backend [EXTRACTED 1.00]

## Communities (8 total, 3 thin omitted)

### Community 0 - "Backend Architecture & Scoring"
Cohesion: 0.38
Nodes (7): Call QC Evaluator Constraints, Database Schema, Deterministic vs Model Boundary, Coaching Rubric, Kick-off Rubric, Backend Handoff, Scoring Pipeline Logic

### Community 1 - "Report UI & Evidence Display"
Cohesion: 0.33
Nodes (6): Design System: Components, Design System: Palette, Reference Frame: Run Page, Reference Frame: Report Header, Reference Frame: Dimension List, Coaching Transcript 01 (Malik Osei)

### Community 2 - "Coaching Rubric & Transcripts"
Cohesion: 0.33
Nodes (6): QC Evaluator UI Screenshot - Overview, UI Screenshot: Full Report Page, Call Evaluation Exercise README, Coaching Call Scoring Rubric, Coaching Call Transcript 01 (Malik), Coaching Call Transcript 02 (Hannah)

### Community 3 - "Project Brief & Source Corpus"
Cohesion: 0.40
Nodes (5): BeaverMind Stage 2 — Braindump, BeaverMind Stage-2 — call QC evaluator, Coaching Transcript 02 (Hannah Vogel), Kick-off Transcript 01 (Owen Brandt), Kick-off Transcript 02 (Renata Cruz)

### Community 4 - "Kick-off Rubric & Domain Canon"
Cohesion: 0.40
Nodes (5): Halden Method, North Star Statement, Kick-off Call Scoring Rubric, Kick-off Call Transcript 01 (Owen), Kick-off Call Transcript 02 (Renata)

## Knowledge Gaps
- **20 isolated node(s):** `Coaching Transcript 02 (Hannah Vogel)`, `Kick-off Transcript 01 (Owen Brandt)`, `Kick-off Transcript 02 (Renata Cruz)`, `Design System: Icons`, `Reference Frame: Icons` (+15 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Design System: Components` connect `Report UI & Evidence Display` to `Coaching Rubric & Transcripts`?**
  _High betweenness centrality (0.442) - this node is a cross-community bridge._
- **Why does `BeaverMind Stage 2 — Braindump` connect `Project Brief & Source Corpus` to `Backend Architecture & Scoring`, `Report UI & Evidence Display`?**
  _High betweenness centrality (0.433) - this node is a cross-community bridge._
- **Why does `Call Evaluation Exercise README` connect `Coaching Rubric & Transcripts` to `Kick-off Rubric & Domain Canon`?**
  _High betweenness centrality (0.385) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Design System: Components` (e.g. with `Reference Frame: Report Header` and `Reference Frame: Dimension List`) actually correct?**
  _`Design System: Components` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Coaching Transcript 02 (Hannah Vogel)`, `Kick-off Transcript 01 (Owen Brandt)`, `Kick-off Transcript 02 (Renata Cruz)` to the rest of the system?**
  _20 weakly-connected nodes found - possible documentation gaps or missing edges._