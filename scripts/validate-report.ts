/**
 * Gate between the scorer and the page.
 *
 * Everything here was a real defect that shipped to the report at least once: quotes that
 * existed nowhere in the transcript, line numbers off by one to three, speaker chips over the
 * other person's turn, and a dimension citing another dimension's evidence. None of that is
 * catchable by reading the page — it is only catchable by re-deriving it from the source.
 *
 *   npm run validate                     # coaching-01
 *   npm run validate -- eval/out/x.json fixtures/report-copy/x.json fixtures/transcripts/x.txt
 *
 * Exits non-zero on any failure, so it can sit in front of the render step.
 */
import { readFileSync } from "node:fs";

const SCORED = process.argv[2] ?? "eval/out/coaching-01.json";
const COPY = process.argv[3] ?? "fixtures/report-copy/coaching-01.json";
const TRANSCRIPT = process.argv[4] ?? "fixtures/transcripts/coaching-01.txt";

const run = JSON.parse(readFileSync(SCORED, "utf8"));
// Optional. Once the scorer emits oneThing / brief / redFlags itself, the run JSON carries
// them and no hand-written copy exists. Fall back to the run's own fields.
let copyFile: any = {};
try { copyFile = JSON.parse(readFileSync(COPY, "utf8")); } catch { copyFile = {}; }
const copy = {
  ...copyFile,
  oneThing: run.oneThing ?? copyFile.oneThing,
  brief: run.brief ?? copyFile.brief,
  redFlags: run.redFlags ?? copyFile.redFlags,
};
const lines = readFileSync(TRANSCRIPT, "utf8").split("\n");

/** Same normalisation the scorer uses: quotes match on meaning-preserving punctuation drift. */
const norm = (s: string) =>
  s
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const NORM = lines.map(norm);
const speakerOf = (lineNo: number) =>
  /^\[([^\]]+)\]:/.exec(lines[lineNo - 1] ?? "")?.[1] ?? null;

const fail: string[] = [];
const warn: string[] = [];
let checked = 0;

// ---- evidence ---------------------------------------------------------------
for (const d of run.dimensions) {
  for (const e of d.evidence ?? []) {
    checked++;
    const where = `${d.id} L${e.line}`;
    const q = norm(e.quote ?? "");

    if (e.status !== "verified") {
      warn.push(`${where} status=${e.status} — renders as an unverified row: "${String(e.quote).slice(0, 50)}…"`);
      continue;
    }

    // 1. the quote exists in the transcript at all
    const hits: number[] = [];
    NORM.forEach((l, i) => { if (q && l.includes(q)) hits.push(i + 1); });
    if (hits.length === 0) {
      fail.push(`${where} QUOTE NOT IN TRANSCRIPT: "${String(e.quote).slice(0, 60)}…"`);
      continue;
    }

    // 2. the line it claims is a line it is actually on
    if (!hits.includes(e.line)) {
      fail.push(`${where} WRONG LINE — quote is at L${hits.join("/L")}, cited L${e.line}`);
    }

    // 3. the speaker chip matches that line's own prefix
    const actual = speakerOf(e.line);
    if (actual && e.speaker && actual !== e.speaker) {
      fail.push(`${where} WRONG SPEAKER — L${e.line} is ${actual}, cited ${e.speaker}`);
    }

    // 4. >=8 words: 8-word spans are 99.7-100% unique per transcript, 3-word only 87-94%
    const words = String(e.quote).trim().split(/\s+/).length;
    if (words < 8) fail.push(`${where} QUOTE TOO SHORT — ${words} words, floor is 8`);

    // 5. the rendered span must be findable too, not just the normalised one
    if (e.exact && !norm(lines[e.line - 1] ?? "").includes(norm(e.exact))) {
      fail.push(`${where} EXACT SPAN not present on L${e.line} — the page renders \`exact\``);
    }
  }
}

// ---- one dimension must not lean on another's evidence ----------------------
const seen = new Map<string, string>();
for (const d of run.dimensions) {
  for (const e of d.evidence ?? []) {
    const key = `${e.line}|${norm(e.quote ?? "")}`;
    const prev = seen.get(key);
    if (prev && prev !== d.id) {
      warn.push(`L${e.line} is cited by both ${prev} and ${d.id} — check it supports both claims`);
    } else if (!prev) seen.set(key, d.id);
  }
}

// ---- arithmetic -------------------------------------------------------------
const active = run.dimensions.filter((d: any) => !d.disabled);
const sum = active.reduce((n: number, d: any) => n + (d.score ?? 0), 0);
const maxSum = active.reduce((n: number, d: any) => n + d.maxPoints, 0);
const t = run.total;

if (sum !== t.rawTotal) fail.push(`TOTAL — dimensions sum to ${sum}, rawTotal says ${t.rawTotal}`);
if (maxSum !== t.maxPossible) fail.push(`TOTAL — active maxima sum to ${maxSum}, maxPossible says ${t.maxPossible}`);

const expected = Math.round((t.rawTotal / t.maxPossible) * 100);
if (expected !== t.normalizedTotal) fail.push(`TOTAL — ${t.rawTotal}/${t.maxPossible} normalises to ${expected}, not ${t.normalizedTotal}`);

const BANDS: Array<[string, number, number]> = [
  ["ELITE", 90, 100], ["STRONG", 80, 89], ["INCONSISTENT", 70, 79],
  ["AT RISK", 60, 69], ["FAIL", 0, 59],
];
const band = BANDS.find(([, lo, hi]) => t.normalizedTotal >= lo && t.normalizedTotal <= hi);
if (band && band[0] !== t.band.name) fail.push(`BAND — ${t.normalizedTotal} is ${band[0]}, report says ${t.band.name}`);

// ---- caps -------------------------------------------------------------------
for (const c of run.caps ?? []) {
  if (!["fired", "not_fired", "indeterminate"].includes(c.determination))
    fail.push(`CAP ${c.id} — determination "${c.determination}" is not one of the three states`);
  if (c.determination === "indeterminate" && !/supporting/i.test(c.statement ?? ""))
    fail.push(`CAP ${c.id} — indeterminate but the statement does not quote both sides`);
}

// ---- the three hand-written sections ---------------------------------------
if (!run.dimensions.some((d: any) => d.id === copy.oneThing?.dimensionId))
  fail.push(`ONE THING — points at ${copy.oneThing?.dimensionId}, which is not a dimension in this run`);
for (const f of copy.redFlags ?? []) {
  if (!lines[f.line - 1]?.trim()) fail.push(`RED FLAG — L${f.line} is not a line in the transcript`);
  if (!["HIGH", "MEDIUM", "LOW"].includes(f.severity)) fail.push(`RED FLAG — bad severity "${f.severity}"`);
}
for (const k of ["oneThing", "brief", "redFlags"]) {
  if (copy[k] == null) fail.push(`REPORT COPY — "${k}" is missing; the brief requires it`);
}

// ---- report -----------------------------------------------------------------
console.log(`checked ${checked} evidence rows across ${run.dimensions.length} dimensions`);
console.log(`  ${t.rawTotal}/${t.maxPossible} -> ${t.normalizedTotal}/100 ${t.band.name}`);
for (const w of warn) console.log(`  warn  ${w}`);
if (fail.length) {
  console.error(`\n${fail.length} FAILURE(S):`);
  for (const f of fail) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`\nok — every quote is in the transcript, on the line it claims, attributed to the`);
console.log(`speaker of that line, at least 8 words long, and the arithmetic closes.`);
