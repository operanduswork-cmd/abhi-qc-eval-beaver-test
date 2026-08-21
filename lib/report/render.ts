/**
 * Renders a ReportContract into the report page — the pure half of scripts/render-report.ts.
 *
 * Extracted so the SAME code builds the design preview at the command line and the live report
 * a visitor sees at /runs/:id. Re-implementing this markup in React would have guaranteed the
 * two drift, and the whole point of the contract is that the page shows what the scorer
 * produced.
 *
 * No file I/O and no process state: page HTML in, page HTML out.
 */
import { iconSvg } from "./icons.ts";

export function renderReport(run: any, copy: any, pageHtml: string): string {
const esc = (s: unknown) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- tokens shared with the rest of the page -------------------------------
const CARD =
  "background:var(--qc-raised);border:1px solid var(--qc-rule);border-radius:16px;overflow:hidden";
const HEAD =
  "padding:9px 15px;background:var(--qc-sunk);border-bottom:1px solid var(--qc-rule);display:flex;align-items:center;gap:9px";
const LAB = "font:8.5px/1 var(--qc-mono);letter-spacing:.16em;color:var(--qc-ink-dim)";

const BUCKET: Record<string, string> = {
  Elite: "--qc-elite",
  Strong: "--qc-strong",
  Mid: "--qc-inconsistent",
  Weak: "--qc-at-risk",
  Fail: "--qc-fail",
};
const BANDTOK: Record<string, string> = {
  ELITE: "--qc-elite",
  STRONG: "--qc-strong",
  INCONSISTENT: "--qc-inconsistent",
  "AT RISK": "--qc-at-risk",
  FAIL: "--qc-fail",
};

const head = (label: string, extra = "") =>
  `<div style="${HEAD}"><span style="width:5px;height:5px;border-radius:999px;background:var(--qc-cite)"></span>` +
  `<span style="${LAB}">${label}</span>` +
  (extra ? `<span style="flex:1"></span><span style="${LAB}">${extra}</span>` : "") +
  `</div>`;

// The two rubrics have separate icon sets, so the mark is keyed by call type as well as id —
// "D1" alone means "Check-In & Connection" on one pack and "Pre-Call Preparation" on the other.
const icon = (id: string) => iconSvg(`${run.callType}:${id}`);

// ---- A GRADE AND A TOTAL ----------------------------------------------------
const t = run.total;
const bandTok = BANDTOK[t.band.name] ?? "--qc-inconsistent";
const TRACKS =
  "minmax(0,60fr) minmax(0,10fr) minmax(0,10fr) minmax(0,10fr) minmax(0,10fr)";
const segs = ["FAIL", "AT RISK", "INCONSISTENT", "STRONG", "ELITE"];

const rail =
  `<div style="display:grid;grid-template-columns:${TRACKS};gap:3px">` +
  segs
    .map(
      (s) =>
        `<div style="height:6px;border-radius:2px;background:${
          s === t.band.name ? `var(${bandTok})` : "var(--qc-rule-strong)"
        }"></div>`,
    )
    .join("") +
  `</div><div style="display:grid;grid-template-columns:${TRACKS};gap:3px;margin-top:8px">` +
  ["&lt;60", "60", "70", "80", "90"]
    .map(
      (v, i) =>
        `<span style="${LAB}${segs[i] === t.band.name ? `;color:var(${bandTok})` : ""}">${v}</span>`,
    )
    .join("") +
  `</div>`;

const ts = run.talkShare;
const pct = (x: number) => (x * 100).toFixed(1) + "%";

// Caps that did something get a one-line verdict; the evidence behind it is one click away.
// Printing the raw statements inline buried the score under six paragraphs.
const capShown = run.caps.filter((c: any) => c.determination !== "not_fired");
const capLines = capShown.length
  ? `<div style="margin-top:12px;padding-top:11px;border-top:1px solid var(--qc-rule)">` +
    capShown
      .map((c: any) => {
        const fired = c.determination === "fired";
        const tone = fired ? "--qc-fail" : "--qc-at-risk";
        const verdict = fired
          ? `applied &mdash; ${c.scope === "total" ? "total" : c.target} capped at ${c.clamp}`
          : `not applied &mdash; a penalty that cannot be established is not applied`;
        return (
          `<details style="margin-bottom:5px">` +
          `<summary style="list-style:none;cursor:pointer;display:flex;align-items:baseline;gap:9px">` +
          `<span style="font:9.5px var(--qc-mono);letter-spacing:.1em;color:var(${tone});flex:none">` +
          `${esc(String(c.determination).toUpperCase())}</span>` +
          `<span style="font:11.5px var(--qc-body);color:var(--qc-ink-muted);flex:1">` +
          `<b style="color:var(--qc-brand);font-weight:600">${esc(c.id)}</b> &mdash; ${verdict}</span>` +
          `<span class="qc-chev" style="font:11px var(--qc-mono);color:var(--qc-ink-dim)">&rsaquo;</span>` +
          `</summary>` +
          `<div style="font:11px/1.6 var(--qc-body);color:var(--qc-ink-muted);margin:7px 0 0 26px;` +
          `padding-left:12px;border-left:2px solid var(--qc-rule-strong);max-width:74ch">` +
          `${esc(c.statement)}</div></details>`
        );
      })
      .join("") +
    `</div>`
  : "";

// Drop the notes that just restate a cap verdict already on screen.
const shownIds = capShown.map((c: any) => c.id);
const notes = (t.arithmeticNotes ?? []).filter(
  (n: string) => !shownIds.some((id: string) => n.startsWith(id)),
);

const runCode = String(run.transcriptSha256).slice(0, 6).toUpperCase();

const grade =
  `<div style="${CARD};margin-bottom:14px">` +
  head("A GRADE AND A TOTAL", `RUN ${runCode}`) +
  `<div style="padding:18px 18px 20px;display:flex;gap:34px;align-items:flex-start">` +
  `<div style="flex:none"><div style="display:flex;align-items:baseline;gap:8px">` +
  `<span style="font-family:var(--qc-display);font-weight:700;font-size:74px;line-height:.9;` +
  `letter-spacing:-.05em;color:var(${bandTok})">${t.normalizedTotal}</span>` +
  `<span style="font:12px var(--qc-mono);color:var(--qc-ink-dim)">/100</span></div>` +
  `<div style="font:600 12px/1 var(--qc-mono);letter-spacing:.14em;color:var(${bandTok});` +
  `margin-top:12px">${esc(t.band.name)}</div></div>` +
  `<div style="flex:1;padding-top:8px">${rail}` +
  `<div style="font:11px var(--qc-mono);color:var(--qc-ink-muted);margin-top:14px">` +
  `raw ${t.rawTotal} / ${t.maxPossible} &nbsp;&rarr;&nbsp; ${t.normalizedTotal}</div>` +
  `<div style="font:11px var(--qc-mono);color:var(--qc-ink-muted);margin-top:6px">` +
  `coach talk share ${pct(ts.coachWordShare)} by word &nbsp;·&nbsp; ` +
  `${pct(ts.coachTimeShareLow)}&ndash;${pct(ts.coachTimeShareHigh)} by time at rate ratio ` +
  `${ts.rateRatioRange.min}&ndash;${ts.rateRatioRange.max} &nbsp;·&nbsp; threshold 75%</div>` +
  capLines +
  notes
    .map(
      (n: string) =>
        `<div style="font:10.5px/1.5 var(--qc-body);color:var(--qc-ink-dim);margin-top:9px">${esc(n)}</div>`,
    )
    .join("") +
  `</div></div></div>`;

// ---- THE ONE THING (counterfactual computed, never asserted) ----------------
/**
 * The scorer now emits oneThing / brief / redFlags itself (lib/scoring/synthesize.ts), so the
 * run JSON is the source of truth. `fixtures/report-copy/<run>.json` remains only as a fallback
 * for a run scored before synthesis existed; a run that carries its own is rendered from its own.
 */
const said = {
  oneThing: run.oneThing ?? copy.oneThing,
  brief: run.brief ?? copy.brief,
  redFlags: run.redFlags ?? copy.redFlags,
};

const ot = said.oneThing;
const lifted = run.dimensions.find((d: any) => d.id === ot.dimensionId);
if (!lifted) throw new Error(`oneThing points at ${ot.dimensionId}, which is not in the run`);

const cfRaw = t.rawTotal - (lifted.score ?? 0) + ot.wouldScore;
const cfNorm = Math.round((cfRaw / t.maxPossible) * 100);
const BANDS: Array<[string, number]> = [
  ["ELITE", 90],
  ["STRONG", 80],
  ["INCONSISTENT", 70],
  ["AT RISK", 60],
  ["FAIL", 0],
];
const cfBand = BANDS.find(([, min]) => cfNorm >= min)![0];
const cfTok = BANDTOK[cfBand]!;

const one =
  `<div style="${CARD};margin-bottom:14px">` +
  head("THE ONE THING") +
  `<div style="padding:20px;display:flex;gap:34px;align-items:flex-start;flex-wrap:wrap">` +
  `<div style="font-family:var(--qc-display);font-weight:600;font-size:24px;line-height:1.26;` +
  `letter-spacing:-.03em;color:var(--qc-brand);flex:1;min-width:22ch">${esc(ot.text)}</div>` +
  `<div style="flex:none;border-left:1px solid var(--qc-rule);padding-left:22px">` +
  `<div style="${LAB}">WOULD HAVE SCORED</div>` +
  `<div style="display:flex;align-items:baseline;gap:8px;margin-top:9px">` +
  `<span style="font-family:var(--qc-display);font-weight:700;font-size:34px;line-height:1;` +
  `letter-spacing:-.04em;color:var(${cfTok})">${cfNorm}</span>` +
  `<span style="font:10px var(--qc-mono);color:var(--qc-ink-dim)">/100</span>` +
  `<span style="font:600 9.5px/1 var(--qc-mono);letter-spacing:.12em;color:var(${cfTok});` +
  `background:var(--qc-brand-tint);padding:4px 8px;border-radius:4px">${cfBand}</span></div>` +
  `<div style="${LAB};margin-top:10px">${esc(ot.dimensionId)} ${lifted.score}/${lifted.maxPoints} ` +
  `&rarr; ${ot.wouldScore}/${lifted.maxPoints}</div>` +
  `</div></div></div>`;

// ---- THE BRIEF --------------------------------------------------------------
const brief =
  `<div style="${CARD};margin-bottom:14px">` +
  head("THE BRIEF") +
  `<div style="padding:16px 18px"><p style="margin:0;font:12.5px/1.66 var(--qc-body);` +
  `color:var(--qc-ink-muted);max-width:78ch">${esc(said.brief)}</p></div></div>`;

// ---- RED FLAGS --------------------------------------------------------------
const SEV: Record<string, string> = {
  HIGH: "--qc-fail",
  MEDIUM: "--qc-at-risk",
  LOW: "--qc-ink-dim",
};

const flags =
  `<div style="${CARD};margin-bottom:14px">` +
  head("RED FLAGS", String(said.redFlags.length)) +
  `<div style="padding:2px 18px 14px">` +
  said.redFlags
    .map(
      (f: any) =>
        `<div style="display:flex;gap:14px;padding:13px 0;border-top:1px solid var(--qc-rule)">` +
        `<span style="font:9.5px var(--qc-mono);letter-spacing:.1em;color:var(${SEV[f.severity]});` +
        `width:58px;flex:none;padding-top:2px">${esc(f.severity)}</span>` +
        `<span style="flex:1;font:12px/1.6 var(--qc-body);color:var(--qc-ink-muted)">${esc(f.text)}</span>` +
        `<span style="font:9.5px var(--qc-mono);color:var(--qc-ink-dim);flex:none;padding-top:3px">` +
        `L${String(f.line).padStart(3, "0")}</span></div>`,
    )
    .join("") +
  `</div></div>`;

// ---- TWELVE DIMENSIONS ------------------------------------------------------
const evRow = (e: any) => {
  const ok = e.status === "verified";
  // A quote that failed verification may have no line at all — it was never located.
  // Print an em dash rather than "Lnull", and never a number we cannot stand behind.
  const label = e.line == null ? "&mdash;" : "L" + String(e.line).padStart(3, "0");
  return (
    `<div style="display:flex;gap:14px;margin-top:11px">` +
    `<span style="font:10px var(--qc-mono);color:var(${ok ? "--qc-cite" : "--qc-ink-dim"});` +
    `width:34px;flex:none;padding-top:2px">${label}</span>` +
    `<div style="border-left:2px ${ok ? "solid var(--qc-rule-strong)" : "dashed var(--qc-rule-strong)"};padding-left:14px">` +
    `<div style="${LAB};margin-bottom:5px">${esc(e.speaker)}` +
    (ok ? "" : ` &nbsp;·&nbsp; <span style="color:var(--qc-at-risk)">${esc(e.status)}</span>`) +
    `</div>` +
    `<div style="font:12px/1.55 var(--qc-body);color:var(--qc-brand);max-width:70ch">` +
    `&ldquo;${esc(e.exact ?? e.quote)}&rdquo;</div></div></div>`
  );
};

const row = (d: any) => {
  const tok = BUCKET[d.bucketMatched ?? "Fail"] ?? "--qc-ink-dim";
  const isFail = d.bucketMatched === "Fail";
  const chip = d.disabled ? "N/A" : `${d.score}/${d.maxPoints}`;
  return (
    `<details style="border:1px solid var(--qc-rule);border-radius:8px;background:var(--qc-raised);` +
    `margin-bottom:6px;overflow:hidden">` +
    `<summary style="list-style:none;cursor:pointer;padding:11px 13px;display:flex;align-items:center;gap:11px">` +
    `<span style="font:9.5px var(--qc-mono);color:var(--qc-ink-dim);width:16px">` +
    `${String(d.id).replace("D", "").padStart(2, "0")}</span>` +
    icon(d.id) +
    `<span style="flex:1;font:600 12.5px var(--qc-body);color:var(--qc-brand)">${esc(d.title)}</span>` +
    (d.notEvidenced
      ? `<span style="font:9px var(--qc-mono);letter-spacing:.1em;color:var(--qc-at-risk)">NOT EVIDENCED</span>`
      : "") +
    `<span style="font:10px var(--qc-mono);padding:2px 8px;border-radius:999px;` +
    `background:${isFail ? `var(${tok})` : "var(--qc-brand-tint)"};color:${isFail ? "#fff" : `var(${tok})`}">${chip}</span>` +
    `<span class="qc-chev" style="font:11px var(--qc-mono);color:var(--qc-ink-dim)">&rsaquo;</span>` +
    `</summary>` +
    `<div style="padding:2px 13px 15px 42px;border-top:1px solid var(--qc-rule)">` +
    `<div style="font:12px/1.62 var(--qc-body);color:var(--qc-ink-muted);max-width:78ch;margin-top:12px">` +
    `${esc(d.reasoning)}</div>` +
    (d.absenceStatement
      ? `<div style="margin-top:12px;padding:10px 12px;border-left:3px solid var(--qc-at-risk);` +
        `background:var(--qc-sunk);font:11.5px/1.55 var(--qc-body);color:var(--qc-ink-muted);max-width:74ch">` +
        `${esc(d.absenceStatement)}</div>`
      : "") +
    `<div style="${LAB};margin-top:16px">EVIDENCE &nbsp;·&nbsp; ${d.evidence.length}</div>` +
    d.evidence.map(evRow).join("") +
    `<div style="margin-top:15px;background:var(--qc-sunk);border-radius:8px;padding:12px 14px">` +
    `<div style="${LAB};margin-bottom:7px">QUICK FIX</div>` +
    `<div style="font:12px/1.6 var(--qc-body);color:var(--qc-ink-muted);max-width:74ch">${esc(d.quickFix)}</div>` +
    `</div></div></details>`
  );
};

const dims =
  `<div style="${CARD}">` +
  head("TWELVE DIMENSIONS", `${t.rawTotal} / ${t.maxPossible} RAW &nbsp;·&nbsp; EACH ONE OPENABLE`) +
  `<div style="padding:12px 12px 14px">` +
  run.dimensions.map(row).join("") +
  `</div></div>`;

// ---- assemble ---------------------------------------------------------------
const BODY =
  `<div style="padding:16px 16px 18px;background:var(--qc-paper)">` +
  grade +
  one +
  brief +
  flags +
  dims +
  `</div>`;

const CSS = `
<style>
#qcReport{--qc-cite:#6F00FF}
#qcReport details>summary::-webkit-details-marker{display:none}
#qcReport details[open] .qc-chev{transform:rotate(90deg)}
#qcReport .qc-chev{display:inline-block;transition:transform .22s cubic-bezier(.4,0,.2,1)}
#qcReport details>summary:hover{background:var(--qc-brand-tint)}
#qcReport details[open]{border-color:var(--qc-rule-strong)}
</style>`;

let page = pageHtml;
const open = page.search(/<section class="vw-screen[^"]*" id="3d"[^>]*>/);
if (open < 0) throw new Error("report section #3d not found in the page template");
const start = page.indexOf(">", open) + 1;
const stop = page.indexOf('<section class="vw-screen"', start);
const sec = page.slice(start, stop);

const anchor = sec.indexOf('<div id="qcReport">');
if (anchor < 0) throw new Error("#qcReport anchor not found in the report section");

// Everything before the anchor is the masthead, which we keep. It leaves some <div>s open,
// so count them and close exactly that many — then close the section. Writing a fixed
// number of closers here silently ate the </section> once already.
let keep = sec.slice(0, anchor);
const opens = (keep.match(/<div\b/gi) ?? []).length - (keep.match(/<\/div>/gi) ?? []).length;
if (opens < 0) throw new Error(`masthead closes ${-opens} more divs than it opens`);
/**
 * The masthead is the deck's, and the deck's says "Malik Osei" / "Coached by Priya Raman" /
 * "COACHING CALL - COACHING-01 - E0711E". Kept verbatim it named the FIXTURE's coach and client
 * on every report, whoever's call was actually pasted: the report's own headline lying about
 * whose call it is. The three hooks are filled from the contract instead.
 *
 * `esc` matters here — the names come from the transcript, which is arbitrary pasted text.
 */
const fill = (hook: string, text: string) => {
  const open = keep.indexOf(`<div data-qc="${hook}"`);
  if (open < 0) return;
  const gt = keep.indexOf(">", open);
  const close = keep.indexOf("</div>", gt);
  if (gt < 0 || close < 0) return;
  keep = keep.slice(0, gt + 1) + esc(text) + keep.slice(close);
};
fill("report-meta", `FULL ANALYSIS  \u00b7  ${String(run.callType).toUpperCase()} CALL  \u00b7  RUN ${runCode}`);
fill("report-title", run.client || "This call");
fill("report-sub", run.coach ? `Coached by ${run.coach}` : "Coach not named in the transcript");

const rebuilt =
  keep + `<div id="qcReport">` + BODY + `</div>` + CSS + "\n" + "</div>".repeat(opens) + "</section>\n";
page = page.slice(0, start) + rebuilt + page.slice(stop);

// Prove the section closes cleanly rather than trusting the arithmetic above.
const check = rebuilt;
const bal = (check.match(/<div\b/gi) ?? []).length - (check.match(/<\/div>/gi) ?? []).length;
if (bal !== 0) throw new Error(`report section left ${bal} unbalanced <div>s`);
if (!check.includes("</section>")) throw new Error("report section lost its </section>");

// The progress screen (#3c) is NOT rendered here.
//
// It used to be: this function wrote a synthetic in-flight snapshot into the static deck — the
// first nine rows carrying real scores, the last three faked as failed / scoring / queued. That
// snapshot then shipped as the live progress page for every run, so a real run at 5 of 12 was
// served a page reading "9 / 12" with twelve invented scores above the true count.
//
// lib/report/serve.ts fills that screen per request from progressFor(), which reads the
// dimensions actually committed so far. There is nothing here to pre-render.

const evTotal = run.dimensions.reduce((n: number, d: any) => n + d.evidence.length, 0);

  return page;
}
