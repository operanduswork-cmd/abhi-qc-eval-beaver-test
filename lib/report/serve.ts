import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderReport } from "./render.ts";
import { iconSvg } from "./icons.ts";
import type { ReportContract } from "./contract.ts";
import type { RunProgress } from "../run.ts";

/**
 * Turns the design deck into the live app.
 *
 * `app/index.html` is a five-screen deck with prev/next chrome, built for reviewing the design.
 * The app needs one screen at a time, chosen by URL, with real data in it. Rather than
 * re-implement that markup in React — which would guarantee the two drift — the page is served
 * as-is with the deck chrome hidden and a single screen revealed.
 *
 * So the report a visitor sees and the report `npm run render` produces are the same code path,
 * and `npm run validate` therefore checks the thing that actually ships.
 *
 * EVERY screen of the deck ships with plausible mock content, and mock content served as if it
 * were real is the worst failure this app can have — it is the exact opposite of the brief's
 * "evidence or nothing". Three screens shipped that way at first: the landing listed invented
 * runs, the run form's "MEASURED ON PASTE" panel showed hardcoded counts against an empty
 * textarea, and the progress screen showed a fixed "9 / 12" with twelve invented scores directly
 * above the real count. Anything the deck draws is now either filled from the run or removed.
 */

let template: string | null = null;

function page(): string {
  // Read once per lambda instance. The file is ~400KB and does not change at runtime.
  if (template) return template;
  template = readFileSync(join(process.cwd(), "app", "index.html"), "utf8");
  return template;
}

/**
 * Responsive rules.
 *
 * The design is a deck built for a desktop review, and it had a hard minimum content width:
 * measured on the live site, the report section was 882px and the form 762px, which forced the
 * layout viewport to ~576px on a 390px phone and clipped content off BOTH edges — the Download
 * PDF button off the right, the pull quote sliced in half, the left margin gone.
 *
 * Three causes, all in the deck chrome rather than the report content:
 *   .dv-opt{flex:none}                  the wrapper physically cannot shrink
 *   .vw-stage{padding:38px;center}      76px of side padding, centring an unshrinkable child
 *   no media queries existed at all     only prefers-reduced-motion and print
 *
 * `!important` is deliberate, not lazy: the report's grids are set with inline
 * style="display:grid;grid-template-columns:…", and an author rule cannot beat an inline
 * declaration — an author !important can.
 *
 * `min-width:0` matters more than it looks. Grid and flex children default to min-width:auto, so
 * one long unbroken word widens its own track and re-breaks the layout. HANDOFF-BACKEND.md §8
 * already flagged this exact trap for the band rail.
 */
const RESPONSIVE = `
@media (max-width: 720px){
  .vw-stage{padding:12px 12px 48px!important;justify-content:flex-start!important;display:block!important}
  .vw-screen,.dv-opt{max-width:100%!important;width:100%!important}
  .dv-opt{flex:1 1 auto!important;min-width:0!important}

  /* Any desktop multi-column grid becomes one column. */
  [id="3d"] [style*="grid-template-columns"],
  [id="2b"] [style*="grid-template-columns"],
  [id="3c"] [style*="grid-template-columns"]{
    grid-template-columns:minmax(0,1fr)!important;
  }
  /* ...except the band rail, which is meaningful only as a row. Let it shrink instead. */
  [id="3d"] [style*="60fr"]{
    grid-template-columns:minmax(0,60fr) repeat(4,minmax(0,10fr))!important;
  }

  /* Nothing may set its own floor. */
  [id="3d"] *,[id="2b"] *,[id="3c"] *{min-width:0!important}

  /* Rows that sit side by side on desktop wrap instead of overflowing. */
  [id="3d"] [style*="display:flex"],[id="2b"] [style*="display:flex"]{flex-wrap:wrap!important}

  /* Wrapping alone is not enough where both children are narrow: the score block kept the
     score and the detail column side by side at 117px and 81px, squeezing the talk-share
     line into a ribbon and collapsing the band labels into "6 07 08 09 0". The wide desktop
     gap is the reliable signature of these two-up rows, so stack them outright. */
  [id="3d"] [style*="gap:34px"],[id="2b"] [style*="gap:34px"],
  [id="3d"] [style*="gap:28px"]{flex-direction:column!important;gap:16px!important;align-items:stretch!important}
  [id="3d"] [style*="gap:34px"]>*,[id="2b"] [style*="gap:34px"]>*{width:100%!important}

  /* The masthead action row went from one button to three (Evaluate another call / Share link /
     Download PDF) and the deck sets flex-shrink:0 on it, so at 390px it pushed the card 55px
     wider than the viewport. Let it wrap instead. */
  [id="3d"] [data-qc="report-actions"]{
    flex-wrap:wrap!important;flex-shrink:1!important;min-width:0!important;
    justify-content:flex-start!important;
  }
  [id="3d"] [data-qc="report-actions"] .qc-dl{flex:0 1 auto!important}

  /* Evidence quotes and long ids must never push a row wide. */
  [id="3d"] blockquote,[id="3d"] code,[id="3d"] p,[id="3d"] summary{overflow-wrap:anywhere!important}

  /* The one-thing pull quote is a display size built for a wide column. */
  [id="3d"] h1{font-size:clamp(22px,6vw,34px)!important;line-height:1.18!important}
  [id="3d"] h2{font-size:clamp(18px,5vw,26px)!important}

  /* Horizontal padding tuned for a 1100px stage is most of a phone. */
  [id="3d"] [style*="padding:26px"],[id="3d"] [style*="padding:22px"],
  [id="2b"] [style*="padding:26px"]{padding:14px!important}

  textarea{font-size:16px!important} /* iOS zooms the page for anything smaller */

  /* The hero's "— QC Evaluator —" row is a flex row with two fixed 74px decorative dashes,
     which makes it 459px wide on a 390px phone. The dashes are ornament; the title is not. */
  [id="3b"] [style*="gap:20px"]{flex-wrap:wrap!important;justify-content:center!important}
  [id="3b"] [style*="width:74px"][style*="linear-gradient"]{display:none!important}
  [id="3b"] h1,[id="3b"] [style*="font-size"]{max-width:100%!important}

  /* The app chrome strip (search, clock, avatar) is desktop furniture and its avatar dot
     pushes past the edge at 360px. It carries no information the phone view needs. */
  [id="3b"] [style*="border:1px solid #6F00FF"][style*="border-radius:999px"]{display:none!important}
}`;

/**
 * The page's own surface: the deep grey-purple the landing hero already uses, and a rainbow edge
 * on all four sides of the card rather than a stripe along the top.
 *
 * `SPECTRUM` is the deck's own gradient, lifted verbatim from the strip it draws above every
 * card. Reusing the exact stops is the point — a hand-picked approximation would be a fifth
 * palette in a design system that already has one.
 *
 * The border is the two-layer `background-clip` trick: paint the card colour clipped to the
 * padding box and the gradient clipped to the border box, then make the border transparent so
 * the gradient shows through it. It needs a real `border` width to have anywhere to show, and it
 * needs to beat the deck's inline `background:#fff`, hence `!important`.
 */
/**
 * The landing hero, the progress hero and the report masthead are all `#423A5E`. The page behind
 * them is the same hue two steps down: at the identical value the landing hero dissolved into
 * the page and read as a hole in the card rather than a panel on it.
 */
const INK = "#332C4A";
const SPECTRUM = "linear-gradient(135deg,#3FA85C,#2F6FBF,#7B2FE8,#E8DE3E)";

const SURFACE = `
  /* The far background, on every page. The deck left it #EDEDEB, so a full-bleed app looked
     like a mockup lying on a sheet of paper. */
  html,body{background:${INK}!important}
  .vw-stage{background:${INK}!important}

  /* Rainbow on all four sides. 9px, not the 4px it started at — at 4 it read as a hairline
     artefact of the screenshot rather than a deliberate frame, and the gradient had too little
     room to travel through its four stops on the short edges. The radius grows with it so the
     corners stay a smooth arc instead of a thick angle. */
  .dv-card{
    border:9px solid transparent!important;
    border-radius:24px!important;
    background:
      linear-gradient(var(--qc-paper),var(--qc-paper)) padding-box,
      ${SPECTRUM} border-box!important;
    box-shadow:0 22px 60px rgba(0,0,0,.34)!important;
  }
  /* ...which makes the deck's top-edge stripe a doubled line. */
  .dv-card>div[style*="height:4px"][style*="linear-gradient(90deg"]{display:none!important}

  /* The chrome strip is now just the mark and the wordmark, so it no longer needs a full row. */
  .qc-chrome{border-radius:15px 15px 0 0!important}

  /* THE PDF IS WHAT THE CLIENT SEES. None of the above belongs on paper: a full-bleed dark
     background is a page of ink, and a gradient border prints as a muddy frame. */
  @media print{
    html,body,.vw-stage{background:#fff!important}
    .dv-card{border:0!important;box-shadow:none!important;border-radius:0!important;
             background:var(--qc-paper)!important}
  }`;

/** Hide the deck's own navigation and show exactly one screen. */
function only(screenId: string, extraScript = "", extraCss = ""): string {
  return `<style>
  .vw-bar,.vw-menu,.vw-edge{display:none!important}
  .vw-screen{display:none!important}
  .vw-screen[id="${screenId}"]{display:block!important}

  /* FULL-SIZE THE APP.
     The deck sizes .dv-opt with flex:none, so the app renders at its intrinsic 762px and
     floats centred in grey on any real monitor — which reads as a mockup, not a product.
     Let it grow, cap it for readability, and give it a proper page gutter. */
  .vw-stage{padding:24px 24px 64px!important;justify-content:center!important;min-height:100vh!important}
  .vw-screen[id="${screenId}"]{width:100%!important;max-width:1180px!important;margin:0 auto!important}
  .dv-opt{flex:1 1 auto!important;width:100%!important;min-width:0!important;max-width:100%!important}
  .dv-card{width:100%!important}
${SURFACE}
${RESPONSIVE}
${extraCss}
</style>
<script>${extraScript}</script>`;
}

const inject = (html: string, block: string) =>
  html.includes("</body>") ? html.replace("</body>", `${block}</body>`) : html + block;

/**
 * The two pages that are not the app: a mistyped run link and an id nobody has.
 *
 * They do not go through the deck — there is no run to render — but they are still the product,
 * and dropping to a white page with a system font is how a 404 reads as a crash rather than an
 * answer. Same ground, same card, same rainbow edge, in about twenty lines of self-contained
 * markup with no dependency on the 400KB template.
 */
export function renderNotice(title: string, heading: string, body: string): string {
  return `<!doctype html><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  html,body{margin:0;background:${INK}}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
       box-sizing:border-box;
       font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,sans-serif}
  .card{max-width:56ch;width:100%;border:9px solid transparent;border-radius:24px;
        background:linear-gradient(#FAFAFA,#FAFAFA) padding-box,${SPECTRUM} border-box;
        box-shadow:0 22px 60px rgba(0,0,0,.34);padding:34px 32px}
  h1{margin:0 0 12px;font:600 21px/1.25 inherit;letter-spacing:-.02em;color:#131628}
  p{margin:0;font:400 15px/1.65 inherit;color:rgba(19,22,40,.62)}
  code{font:13px ui-monospace,SFMono-Regular,Menlo,monospace;background:rgba(19,22,40,.06);
       padding:2px 6px;border-radius:4px}
  a{color:#6F00FF;font-weight:600}
</style>
<div class="card"><h1>${heading}</h1><p>${body}</p></div>
<script>setTimeout(function(){ location.href = '/'; }, 600000);</script>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * The list of runs THIS browser started.
 *
 * It lives in localStorage because the alternative is a server-side "recent runs" query, and the
 * first version of the landing page had exactly that: it listed every run in the database to
 * every visitor. The run id IS the capability that makes a report shareable without a login, so
 * a page that prints the ids hands that capability to anyone who loads it.
 *
 * A link you paste to a colleague still opens the full report for them. They just do not also
 * receive a directory of everyone else's calls.
 */
const STORE = String.raw`
var QC_STORE = 'qc.runs';
function qcIds(){
  try{
    var v = JSON.parse(localStorage.getItem(QC_STORE) || '[]');
    return Array.isArray(v) ? v.filter(function(x){ return typeof x === 'string'; }).slice(0,24) : [];
  }catch(e){ return []; }
}
function qcRemember(id){
  if(!id) return;
  try{
    var ids = qcIds().filter(function(x){ return x !== id; });
    ids.unshift(id);
    localStorage.setItem(QC_STORE, JSON.stringify(ids.slice(0,24)));
  }catch(e){ /* private mode, quota, storage disabled: the app works, the list is just empty */ }
}`;

/** Copy to clipboard with a fallback, then flash a confirmation on `el` for 1.6s. */
const COPY = String.raw`
function qcCopy(text, el, done){
  function flash(msg){
    if(!el) return;
    var was = el.getAttribute('data-was') || el.textContent;
    el.setAttribute('data-was', was);
    el.textContent = msg;
    setTimeout(function(){ el.textContent = el.getAttribute('data-was'); }, 1600);
  }
  function fallback(){
    try{
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;top:-1000px';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); flash(done);
    }catch(e){ flash('Press Ctrl+C'); }
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){ flash(done); }, fallback);
  } else fallback();
}`;

/**
 * The past-runs list, wherever it is mounted.
 *
 * The deck draws it on the landing (screen 3b) and that is where it first shipped, but it
 * belongs on the run form: you go to the landing to start a run, and you go to the form to
 * either start one or pick up one you already started. So `renderRunForm` moves the deck's own
 * `[data-runs]` nodes across the document into the form, and the landing removes them.
 *
 * Fetched client-side rather than rendered server-side because the server has no idea which runs
 * belong to this visitor and must not be asked to guess — see STORE above.
 */
const RUN_LIST = String.raw`
function qcMountRuns(list, empty){
  var TOK = {ELITE:'--qc-elite',STRONG:'--qc-strong',INCONSISTENT:'--qc-inconsistent',
             'AT RISK':'--qc-at-risk',FAIL:'--qc-fail',FAILED:'--qc-fail',SCORING:'--qc-inconsistent'};
  if(!list || !empty) return;

  var scope = document.querySelector('[data-qc="runs-scope"]');
  if(scope) scope.textContent = 'THIS BROWSER';

  var ids = qcIds();
  if(!ids.length) return;   // the empty state is already what is showing

  fetch('/api/runs/summary', {method:'POST', headers:{'Content-Type':'application/json'},
                              body: JSON.stringify({ids: ids})})
    .then(function(r){ return r.ok ? r.json() : {runs:[]}; })
    .catch(function(){ return {runs:[]}; })
    .then(function(j){
      var runs = (j.runs || []).map(function(r){
        return {
          id: r.id,
          code: r.code || '',
          label: r.callType + ' call',
          when: new Date(r.createdAt).toLocaleString(undefined,
                  {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}),
          band: r.status === 'succeeded' ? (r.band || '') :
                r.status === 'failed'    ? 'FAILED' : 'SCORING',
          score: (r.status === 'succeeded' && r.score !== null) ? String(r.score) : '—'
        };
      });
      if(!runs.length) return;

      list.removeAttribute('hidden');
      empty.setAttribute('hidden','');

      // The row container is the parent of the first designed row. Clone that row so the
      // styling comes from the design rather than being restated here.
      var first = list.querySelector('[style*="gap:14px"][style*="padding:11px 15px"]');
      if(!first || !first.parentElement) return;
      var box = first.parentElement, tpl = first.cloneNode(true);
      box.innerHTML = '';

      runs.forEach(function(r){
        var row = tpl.cloneNode(true), sp = row.querySelectorAll('span');
        var tok = TOK[r.band] || '--qc-inconsistent';
        if(sp[0]) sp[0].style.background = 'var(' + tok + ')';
        if(sp[1]){ sp[1].textContent = r.label; sp[1].style.width = '92px'; }
        // The third span is a grey skeleton bar in the design. The run number and the time it
        // was started belong there more than a placeholder does. The code is the SAME one the
        // report masthead prints, so a row and the report it opens cannot disagree.
        if(sp[2]){
          sp[2].style.cssText = 'flex:1;font:9.5px var(--qc-mono);color:var(--qc-ink-dim)';
          sp[2].innerHTML = (r.code ? '<span style="color:#6F00FF;font-weight:700">#' + r.code +
                             '</span>&nbsp;&nbsp;·&nbsp;&nbsp;' : '') + r.when;
        }
        if(sp[3]){ sp[3].textContent = r.band; sp[3].style.color = 'var(' + tok + ')'; }
        if(sp[4]){ sp[4].textContent = r.score; sp[4].style.color = 'var(' + tok + ')';
                   sp[4].style.background = 'var(' + tok + '-tint)'; }
        row.style.cursor = 'pointer';
        row.onclick = function(){ location.href = '/runs/' + r.id; };
        box.appendChild(row);
      });
    });
}`;

/**
 * GET / — the landing page (screen 3b).
 *
 * This was missed on the first pass: the app was served as a single run form, when the deck's
 * own metadata labels 3b "Landing" and 2b "Run form". The landing is the entry point, and it is
 * now only that: the mark, the name, and the way in.
 *
 * The past-runs list the deck draws here has moved to the form, where the work happens. Its
 * nodes are removed rather than hidden, so there is no chance of a stale list flashing before a
 * script gets to it.
 */
export function renderLanding(): string {
  const script = String.raw`
(function(){
  var scr = document.querySelector('.vw-screen[id="3b"]');
  if(!scr) return;

  // The deck ships explicit hooks for exactly this. Earlier attempts inferred the structure
  // from rendered text instead and hid the wrong element three times running — the list's
  // parent, then .dv-opt, then .dv-card. Use the hooks.
  [].slice.call(scr.querySelectorAll('[data-runs]')).forEach(function(e){ e.remove(); });

  var cta = scr.querySelector('[data-goto="1"]');
  if(cta) cta.onclick = function(e){ e.preventDefault(); location.href = '/new'; };
})();`;
  return inject(page(), only("3b", script));
}

/**
 * GET /new — the paste form.
 *
 * The design already draws this screen: a transcript panel, a measurement panel, two call-type
 * cards and a Run evaluation button. None of it was wired. So rather than appending a second
 * form underneath — which is what the first attempt did, and it looked exactly as bad as it
 * sounds — this turns the design's own controls into working ones.
 *
 * Two things the design drew are gone rather than wired. The coach/client/program fields,
 * because the scorer already derives coach and client from the transcript's own `[Speaker]:`
 * labels and nothing ever read program. And the hardcoded measurements, replaced by
 * POST /api/measure — which runs `lib/transcript/*`, the same canonicaliser and talk-share
 * arithmetic the scorer runs, so the panel cannot drift from the numbers the run is scored on.
 *
 * The order the deck drew — paste, then choose the rubric — is inverted here. The rubric is the
 * smaller decision and it changes what the measurement panel says (the talk-share cap is 75% for
 * coaching and 70% for kick-off), so making it first means the panel is right from the first
 * keystroke rather than after a correction.
 */
export function renderRunForm(): string {
  const icons = JSON.stringify({
    kickoff: iconSvg("call:kickoff", 20, "currentColor"),
    coaching: iconSvg("call:coaching", 20, "currentColor"),
  });

  const script =
    STORE +
    RUN_LIST +
    String.raw`
(function(){
  var scr = document.querySelector('.vw-screen[id="2b"]');
  if(!scr) return;
  var ICONS = ` +
    icons +
    String.raw`;
  var state = { callType: 'coaching' };
  var q = function(sel){ return scr.querySelector(sel); };

  // 1 -- the coach / client / program card is redundant, so it goes rather than getting wired.
  var who = q('[data-qc="who-card"]');
  if(who) who.remove();

  // 2 -- the transcript PREVIEW becomes a real input, keeping the panel's styling.
  var panel = q('[data-qc="transcript-panel"]');
  var ta = null;
  if(panel){
    panel.innerHTML = '';
    // Nine rows, not eighteen. A transcript is 126-345 lines: no height that fits on a screen
    // shows a useful fraction of it, so the box only has to be big enough to confirm the paste
    // landed and to scroll. The rest of the height is better spent on what comes after it.
    ta = document.createElement('textarea');
    ta.id = 'qcText';
    ta.rows = 9;
    ta.placeholder = '[Coach Name]: how have you been since we last spoke?\n[Client Name]: honestly, up and down...';
    ta.style.cssText = 'width:100%;border:0;outline:0;background:transparent;resize:vertical;'+
      'font:400 12px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--qc-ink,#000322)';
    panel.appendChild(ta);
  }

  // 3 -- the two call-type cards become a real choice, and get their marks.
  var cards = {};
  [].slice.call(scr.querySelectorAll('[data-qc="calltype"]')).forEach(function(c){
    var k = c.getAttribute('data-call');
    cards[k] = c;
    var slot = c.querySelector('[data-qc="calltype-icon"]');
    if(slot) slot.innerHTML = ICONS[k] || '';
    c.onclick = function(){ state.callType = k; paint(); measureNow(); };
  });
  function paint(){
    Object.keys(cards).forEach(function(k){
      var c = cards[k], on = (k === state.callType);
      c.style.borderColor = on ? 'var(--qc-brand)' : 'var(--qc-rule)';
      c.style.background  = on ? 'var(--qc-brand-tint)' : 'transparent';
      c.style.color       = on ? 'var(--qc-brand)' : 'var(--qc-ink-dim)';
      c.style.cursor = 'pointer';
    });
  }
  paint();

  // 4 -- MEASURED ON PASTE, live.
  //
  // The design shipped this as literal HTML: 196 lines, 35,558 characters, 2 speakers, 66.6%
  // talk-share, "BELOW 75% ON EVERY READING" -- sitting above an EMPTY textarea. It was the most
  // convincing thing on the screen and every number in it was decoration. It now calls
  // /api/measure, which runs the scorer's own transcript code, so it is exactly right rather
  // than approximately right.
  var mBox  = q('[data-qc="measure"]');
  var badge = q('[data-qc="transcript-badge"]');
  var DASH = '—';
  var last = null;

  var VERDICT = {
    fired:         {tone:'var(--qc-fail)',         text:'ABOVE THE CAP ON EVERY READING'},
    not_fired:     {tone:'var(--qc-elite)',        text:'BELOW THE CAP ON EVERY READING'},
    indeterminate: {tone:'var(--qc-inconsistent)', text:'THE INTERVAL STRADDLES THE CAP'}
  };

  function pct(x){ return (x*100).toFixed(1) + '%'; }
  function num(n){ return Number(n).toLocaleString(); }

  function row(label, value){
    return '<div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;'+
           'border-bottom:1px solid var(--qc-rule)">'+
           '<span style="font:10px var(--qc-body);color:var(--qc-ink-dim)">'+label+'</span>'+
           '<span style="font:10px var(--qc-mono);color:#6F00FF;text-align:right">'+value+'</span></div>';
  }

  function repaint(){
    if(!mBox) return;
    var m = last;
    var head = '<div style="font:8.5px/1 var(--qc-mono);letter-spacing:.16em;color:var(--qc-ink-dim);'+
               'margin-bottom:10px">MEASURED ON PASTE</div>';
    var body;

    if(!m){
      body = row('lines', DASH) + row('characters', DASH) + row('speakers', DASH) +
             row('coach talk-share', DASH) + row('[inaudible] markers', DASH) + row('timestamps', DASH) +
             '<div style="font:8.5px/1.5 var(--qc-mono);color:var(--qc-ink-dim);margin-top:10px">'+
             'PASTE A TRANSCRIPT TO MEASURE IT</div>';
    } else if(!m.ok){
      body = row('lines', num(m.lines)) + row('characters', num(m.characters)) +
             row('speakers', String(m.speakers.length)) +
             '<div style="font:9.5px/1.55 var(--qc-body);color:var(--qc-fail);margin-top:10px">'+
             (m.problem || 'This paste cannot be scored.') + '</div>';
    } else {
      var v = VERDICT[m.talkShareVerdict] || VERDICT.not_fired;
      body = row('lines', num(m.lines)) +
             row('characters', num(m.characters)) +
             row('speakers', String(m.speakers.length)) +
             row('coach talk-share', pct(m.coachWordShare) + ' by word') +
             row('&nbsp;&nbsp;by time', pct(m.coachTimeShareLow) + '&ndash;' + pct(m.coachTimeShareHigh)) +
             row('[inaudible] markers', String(m.markers.inaudible || 0)) +
             row('timestamps', m.hasTimestamps ? 'present' : 'none') +
             '<div style="font:8.5px/1.5 var(--qc-mono);color:' + v.tone + ';margin-top:10px">'+
             v.text + ' · CAP ' + pct(m.threshold) + '</div>';
    }
    mBox.innerHTML = head + body;

    if(badge){
      if(!m || !m.lines){ badge.textContent = 'EMPTY'; badge.style.color = 'var(--qc-ink-dim)'; }
      else { badge.innerHTML = 'PASTED &nbsp;·&nbsp; ' + num(m.lines) + ' LINES';
             badge.style.color = m.ok ? 'var(--qc-elite)' : 'var(--qc-at-risk)'; }
    }
  }

  // A light surface with the brand accent on the numbers, instead of the near-black panel the
  // deck drew -- on a white page it read as a console someone had pasted into the form.
  if(mBox){
    mBox.style.cssText = 'background:var(--qc-raised);border:1px solid var(--qc-rule);'+
                         'border-radius:8px;padding:13px 14px';
    repaint();
  }

  var timer = null, seq = 0;
  function measureNow(){
    clearTimeout(timer);
    timer = setTimeout(function(){
      var text = ta ? ta.value : '';
      if(!text.trim()){ last = null; repaint(); return; }
      var mine = ++seq;
      fetch('/api/measure', {method:'POST', headers:{'Content-Type':'application/json'},
                             body: JSON.stringify({transcript: text, callType: state.callType})})
        .then(function(r){ return r.ok ? r.json() : null; })
        .catch(function(){ return null; })
        // Out-of-order responses would otherwise repaint an older paste over a newer one.
        .then(function(m){ if(mine === seq && m){ last = m; repaint(); } });
    }, 300);
  }
  if(ta){
    ta.addEventListener('input', measureNow);
    ta.addEventListener('paste', function(){ setTimeout(measureNow, 0); });
  }

  // 5 -- the Run evaluation control posts. It is a <div> in the design, not a <button>.
  var runEl = q('[data-qc="run"]');
  var msg = document.createElement('div');
  msg.id = 'qcMsg';
  msg.style.cssText = 'margin:12px 0 0;font:500 13px/1.5 system-ui;color:var(--qc-ink-muted,#5A6380);min-height:18px';
  if(runEl && runEl.parentElement) runEl.parentElement.appendChild(msg);

  var busy = false;
  async function submit(){
    if(busy) return;
    var text = ta ? ta.value : '';
    if(!text.trim()){ msg.textContent = 'Paste a transcript first.'; return; }
    busy = true;
    msg.textContent = 'Starting…';
    try{
      var r = await fetch('/api/runs', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ callType: state.callType, transcript: text })
      });
      var j = await r.json();
      // A refusal carries a sentence. Show it; never leave a dead button.
      if(!r.ok){ msg.textContent = j.error || ('Could not start (' + r.status + ')'); busy=false; return; }
      qcRemember(j.id);
      location.href = '/runs/' + j.id;
    }catch(e){ msg.textContent = 'Could not reach the server. ' + e; busy = false; }
  }
  if(runEl){ runEl.style.cursor='pointer'; runEl.onclick = submit; }

  var clearEl = q('[data-qc="clear"]');
  if(clearEl){ clearEl.style.cursor='pointer';
    clearEl.onclick = function(){ if(ta) ta.value=''; last = null; repaint(); msg.textContent=''; }; }

  // The ten-minute return to the landing, with the one guard that matters here: a transcript
  // typed or pasted and not yet submitted is unsaved work, and bouncing the tab would bin it
  // without asking. An empty form is an abandoned tab and goes back.
  setTimeout(function(){
    if(ta && ta.value.trim()) return;
    location.href = '/';
  }, 600000);

  // 6 -- reorder: CHOOSE THE CALL first, then the transcript, then the button, then past runs.
  //
  // The deck stacks it paste-then-choose, with the Run evaluation row living inside the
  // call-type card. Moving nodes is deliberate over rewriting the markup: the cards keep their
  // own styling, so this survives a design refresh that the copies would not.
  var transcriptCard = panel && panel.closest('[style*="border-radius:16px"]');
  var calltypeCard   = cards.coaching && cards.coaching.closest('[style*="border-radius:16px"]');
  var actions        = runEl && runEl.parentElement;
  var column         = transcriptCard && transcriptCard.parentElement;

  if(column && transcriptCard && calltypeCard){
    column.insertBefore(calltypeCard, transcriptCard);
    if(actions){
      // Pulling the button row out of the call-type card leaves it without the card's padding.
      actions.style.padding = '0 2px';
      column.appendChild(actions);
    }

    // 7 -- past runs move here from the landing. This is the page you come back to.
    var src   = document.querySelector('.vw-screen[id="3b"]');
    var list  = src && src.querySelector('[data-runs="list"]');
    var empty = src && src.querySelector('[data-runs="empty"]');
    if(list)  column.appendChild(list);
    if(empty) column.appendChild(empty);
    qcMountRuns(list, empty);
  }
})();`;
  return inject(page(), only("2b", script));
}

/** GET /runs/:id when the run has finished — the real report, same renderer as the CLI. */
export function renderFinished(contract: ReportContract): string {
  const script =
    STORE +
    COPY +
    String.raw`
(function(){
  var RUN = ` + JSON.stringify(contract.runId) + String.raw`;
  qcRemember(RUN);

  var actions = document.querySelector('.vw-screen[id="3d"] [data-qc="report-actions"]');
  if(actions){
    var mk = function(id, label, title, svg, primary){
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'qc-dl'; b.id = id; b.title = title;
      b.style.cssText = primary ? '' :
        'background:transparent;color:#fff;border:1px solid rgba(255,255,255,.45)';
      b.innerHTML = svg + '<span data-qc="' + id + '-label">' + label + '</span>';
      return b;
    };

    // Three ways out, in the order they are wanted: start the next call, send this one to a
    // colleague, hand the client a file.
    var again = mk('qcAgain', 'Evaluate another call', 'Score another transcript',
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
      'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex:none">'+
      '<path d="M12 5v14"/><path d="M5 12h14"/></svg>');
    again.onclick = function(){ location.href = '/new'; };

    // The link is what the shareable-URL constraint is for — it resolves for anyone, with no
    // login, and it still resolves next week.
    var share = mk('qcShare', 'Share link', 'Copy a link to this report',
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
      'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex:none">'+
      '<path d="M9 12h9"/><path d="M14.5 8.5 18 12l-3.5 3.5"/>'+
      '<path d="M12 5.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-.5"/></svg>');
    share.onclick = function(){
      qcCopy(location.href, share.querySelector('[data-qc="qcShare-label"]'), 'Link copied');
    };

    actions.insertBefore(share, actions.firstChild);
    actions.insertBefore(again, actions.firstChild);
  }

  // ---------------------------------------------------------------- citation context
  //
  // Every evidence row's line number is a button. Clicking it fetches the transcript AROUND that
  // line, so the citation can be checked in place instead of trusted.
  //
  // A bounded window, not the whole transcript embedded in the page: this URL is shareable
  // without a login, and today it discloses the quotes the scorer cited. Shipping the entire
  // call inside the HTML would quietly upgrade every shared link from "the evidence" to "the
  // whole conversation".
  var pop = null;
  function closePop(){ if(pop){ pop.remove(); pop = null; } }

  document.addEventListener('click', function(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest('[data-cite-line]') : null;
    if(!btn){ if(pop && !pop.contains(ev.target)) closePop(); return; }
    ev.preventDefault();
    var line = btn.getAttribute('data-cite-line');
    closePop();

    pop = document.createElement('div');
    pop.setAttribute('data-qc','cite-pop');
    pop.style.cssText =
      'position:absolute;z-index:60;max-width:min(560px,92vw);background:var(--qc-raised);'+
      'border:2px solid var(--qc-rule-strong);border-radius:12px;box-shadow:0 18px 44px rgba(0,0,0,.22);'+
      'padding:12px 14px;font:11.5px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace';
    pop.innerHTML = '<div style="font:700 8.5px var(--qc-mono);letter-spacing:.16em;'+
      'color:var(--qc-ink-dim);margin-bottom:8px">TRANSCRIPT AROUND L'+line+'</div>'+
      '<div data-qc="cite-body" style="color:var(--qc-ink-muted)">loading…</div>';
    document.body.appendChild(pop);

    var r = btn.getBoundingClientRect();
    pop.style.top  = (window.scrollY + r.bottom + 8) + 'px';
    pop.style.left = (window.scrollX + Math.min(r.left, document.documentElement.clientWidth - pop.offsetWidth - 16)) + 'px';

    fetch('/api/runs/' + RUN + '/context?line=' + encodeURIComponent(line) + '&radius=3')
      .then(function(res){ if(!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then(function(j){
        var body = pop && pop.querySelector('[data-qc="cite-body"]');
        if(!body) return;
        body.innerHTML = j.lines.map(function(l){
          return '<div style="display:flex;gap:10px;padding:2px 0'+
            (l.cited ? ';background:var(--qc-brand-tint);margin:0 -6px;padding-left:6px;padding-right:6px;border-radius:4px' : '')+'">'+
            '<span style="color:'+(l.cited ? 'var(--qc-cite);font-weight:700' : 'var(--qc-ink-dim)')+
              ';width:34px;flex:none">L'+String(l.n).padStart(3,'0')+'</span>'+
            '<span style="color:'+(l.cited ? 'var(--qc-brand)' : 'var(--qc-ink-muted)')+
              ';overflow-wrap:anywhere">'+
              String(l.text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+
            '</span></div>';
        }).join('');
      })
      .catch(function(e){
        var body = pop && pop.querySelector('[data-qc="cite-body"]');
        if(body) body.textContent = 'Could not load that line. ' + e;
      });
  });

  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closePop(); });
})();
` + REDIRECT_HOME;
  const html = renderReport(contract, {}, page());
  return inject(html, only("3d", script));
}

/**
 * The rotating arc, and the override that stops it being a strobe.
 *
 * Only the progress screen gets this, via only()'s extraCss slot.
 *
 * The arc is an ::after over the ring the deck already draws, so moving the spinner is one
 * attribute write — nothing is inserted or removed and the keyframe never restarts.
 *
 * THE REDUCED-MOTION OVERRIDE IS NOT OPTIONAL. app/index.html carries this, twice:
 *
 *     @media (prefers-reduced-motion: reduce){
 *       *, *::before, *::after { animation-duration:.01ms !important; ... }
 *     }
 *
 * That is the well-known pattern with its second half missing — it sets duration but NOT
 * `animation-iteration-count: 1`. An `infinite` animation under it does not stop; it completes
 * ~100,000 cycles a second and gets sampled once per frame, so the arc lands on an arbitrary
 * angle every frame. That is a strobe, delivered precisely to the people the media query exists
 * to protect. `[data-spin]::after` (0,1,1) outranks `*::after` (0,0,1) at equal !important
 * weight, so this wins regardless of source order — which matters, because only() injects at
 * end-of-body while the deck's block is in <head>.
 */
const SPINNER_CSS = `
  @keyframes qc-spin { to { transform: rotate(360deg); } }
  [data-spin]{position:relative}
  [data-spin]::after{
    content:"";position:absolute;inset:-1.25px;border-radius:999px;
    border:1.25px solid transparent;
    border-top-color:#6F00FF;          /* the literal the SCORING… label uses. NOT
                                          var(--qc-brand) — that is #131628, near-black ink,
                                          and the arc would vanish into the ring. */
    animation:qc-spin .9s linear infinite;
    will-change:transform;
  }
  /* On the dark hero, purple-on-purple has no contrast. */
  [data-spin][data-on-dark]::after{border-top-color:#fff}

  @media (prefers-reduced-motion: reduce){
    [data-spin]::after{
      animation:none!important;
      border-right-color:#6F00FF;      /* a static quarter turn still marks the live row */
    }
    [data-spin][data-on-dark]::after{border-right-color:#fff}
  }`;

/**
 * Send an abandoned tab back to the start after ten minutes.
 *
 * Asked for explicitly, and applied to every page including a finished report. Worth stating
 * once: this also fires for someone who opened a link you shared and is still reading it. A full
 * reload at a terminal state restarts the clock naturally, which is the behaviour you want.
 */
const REDIRECT_HOME = `
setTimeout(function(){ if(location.pathname !== '/') location.href = '/'; }, 600000);`;

export function renderPending(contract: ReportContract, progress: RunProgress): string {
  const failed = contract.status === "failed";
  const marks: Record<string, string> = {};
  for (const d of progress.dimensions) {
    marks[d.id] = iconSvg(`${contract.callType}:${d.id}`, 13, "currentColor");
  }

  const state = JSON.stringify({
    runId: contract.runId,
    callType: contract.callType,
    client: contract.client,
    code: String(contract.transcriptSha256).slice(0, 6).toUpperCase(),
    failed,
    failureReason: contract.failureReason,
    clock: iconSvg("ui:clock", 11, "currentColor"),
  });

  const script =
    STORE +
    COPY +
    String.raw`
(function(){
  var C = ` + state + String.raw`;
  var P = ` + JSON.stringify(progress) + String.raw`;
  var M = ` + JSON.stringify(marks) + String.raw`;

  var scr = document.querySelector('.vw-screen[id="3c"]');
  if(!scr) return;
  var q = function(s){ return scr.querySelector(s); };
  var set = function(s, text){ var e = q(s); if(e) e.textContent = text; };

  qcRemember(C.runId);
  set('[data-qc="prog-meta"]', C.callType.toUpperCase() + ' CALL  ·  RUN #' + C.code);

  // ---------------------------------------------------------------- hero extras
  // The deck draws a count, a bar and a label. It has nowhere to say WHICH phase the run is in,
  // and the fact pass alone is ~30s of the window that felt stuck.
  var head = q('[data-qc="prog-count"]');
  var heroRow = head && head.parentElement;
  if(heroRow && heroRow.parentElement){
    var extra = document.createElement('div');
    extra.innerHTML =
      '<div style="display:flex;align-items:center;gap:9px;margin-top:15px">'+
        '<span data-qc="phase-ring" data-on-dark style="width:13px;height:13px;border-radius:999px;'+
          'border:1.25px solid rgba(255,255,255,.4);flex:none;display:block"></span>'+
        '<span data-qc="phase-text" style="font:600 9.5px var(--qc-mono);letter-spacing:.12em;'+
          'color:rgba(255,255,255,.88)"></span>'+
        '<span style="flex:1"></span>'+
        '<span style="display:flex;align-items:center;gap:6px;font:600 9.5px var(--qc-mono);'+
          'letter-spacing:.08em;color:rgba(255,255,255,.68)">'+
          C.clock + '<span data-qc="eta-text"></span></span>'+
      '</div>'+
      '<div data-qc="eta-basis" style="font:9px var(--qc-mono);color:rgba(255,255,255,.42);'+
        'margin-top:6px;text-align:right"></div>'+
      '<div data-qc="prog-stale" hidden style="font:600 9.5px/1.5 var(--qc-mono);'+
        'color:#F6C453;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.14)"></div>';
    heroRow.parentElement.appendChild(extra);
  }

  // ---------------------------------------------------------------- rows, built ONCE
  //
  // Built once and thereafter only mutated. Reassigning innerHTML on every poll would destroy the
  // node the animation lives on and restart the keyframe from zero each time — the original
  // full-page-reload bug, at 1/100th the bandwidth.
  var list = q('[data-qc="prog-list"]');
  if(list){
    var ROW = 'display:flex;align-items:center;gap:12px;padding:9px 15px;border-bottom:1px solid var(--qc-rule)';
    list.innerHTML = P.dimensions.map(function(d, i){
      return '<div data-dim="' + d.id + '" style="' + ROW + '">'+
             '<span style="font:9.5px var(--qc-mono);color:var(--qc-ink-dim);width:16px">'+
             ('0' + (i+1)).slice(-2) + '</span>'+
             '<span data-qc="ring" style="width:13px;height:13px;border-radius:999px;'+
               'border:1.25px solid var(--qc-rule-strong);flex:none;display:flex;'+
               'align-items:center;justify-content:center"></span>'+
             '<span style="display:flex;color:var(--qc-ink-dim)">' + (M[d.id] || '') + '</span>'+
             '<span style="flex:1;font:11.5px var(--qc-body);color:var(--qc-brand)">' + d.title + '</span>'+
             '<span data-qc="state" style="font:700 9.5px var(--qc-mono);letter-spacing:.1em"></span>'+
             '</div>';
    }).join('');
  }

  // ---------------------------------------------------------------- the standing promise
  if(list && list.parentElement && !C.failed){
    var note = document.createElement('p');
    note.setAttribute('data-qc', 'prog-note-long');
    note.style.cssText = 'margin:12px 2px 0;font:400 12.5px/1.6 var(--qc-body);color:var(--qc-ink-muted);max-width:70ch';
    note.textContent = 'You can close this tab. Scoring continues on the server, and this URL ' +
      'shows the finished report whenever you come back to it. This page checks every five ' +
      'seconds without reloading.';
    var card = list.closest('[style*="border-radius:16px"]') || list.parentElement;
    if(card && card.parentElement) card.parentElement.appendChild(note);
  }

  // ---------------------------------------------------------------- painting
  var PHASE_TEXT = {
    queued:     'QUEUED',
    facts:      'READING THE CALL FOR FACTS',
    dimensions: 'SCORING THE TWELVE DIMENSIONS',
    synthesis:  'WRITING THE BRIEF'
  };

  // A completed dimension gets a tick inside its ring rather than just a green outline — an
  // empty green circle and an empty grey circle are the same shape, and at 13px the colour is
  // doing all the work. Sits inside the ring, so the spinner's ::after still traces the same
  // circle and nothing about moving the spinner changes.
  var TICK = '<svg viewBox="0 0 24 24" width="8" height="8" aria-hidden="true" '+
    'style="display:block;fill:none;stroke:currentColor;stroke-width:3.6;stroke-linecap:round;'+
    'stroke-linejoin:round">'+
    '<path d="M4.5 12.5 L9.5 17.5 L19.5 6.5"/></svg>';

  function spinOn(el){
    var was = scr.querySelector('[data-spin]');
    if(was === el) return;
    if(was) was.removeAttribute('data-spin');
    if(el) el.setAttribute('data-spin','');
  }

  function paint(prog, isFailed, reason){
    set('[data-qc="prog-count"]', prog.done + ' / ' + prog.total);
    set('[data-qc="prog-note"]', isFailed ? 'STOPPED' : 'YOU CAN CLOSE THIS TAB');
    set('[data-qc="prog-title"]',
        isFailed ? 'This run stopped' : (C.client ? 'Scoring ' + C.client : 'Scoring this call'));

    // The BAR spans all fourteen steps — the fact pass, twelve dimensions, synthesis — so it
    // cannot fill while the page still says it is scoring. The COUNT stays n/12, because twelve
    // is the number of things in the report it is counting toward.
    var steps = (prog.phase === 'queued' ? 0 : 1) + prog.done;
    var bar = q('[data-qc="prog-bar"]');
    if(bar){
      bar.style.width = Math.round(steps / (prog.total + 2) * 100) + '%';
      if(isFailed) bar.style.background = 'var(--qc-fail)';
    }

    var tally = q('[data-qc="prog-tally"]');
    if(tally){
      tally.textContent = isFailed ? 'NOTHING FURTHER WILL LAND' : (prog.total - prog.done) + ' TO GO';
      tally.style.color = isFailed ? 'var(--qc-fail)' : 'var(--qc-ink-dim)';
    }

    set('[data-qc="phase-text"]', isFailed ? 'STOPPED' : (PHASE_TEXT[prog.phase] || ''));
    set('[data-qc="eta-text"]', isFailed ? 'NO LONGER RUNNING' : (prog.etaText || ''));
    set('[data-qc="eta-basis"]', isFailed ? '' : (prog.etaBasis || ''));

    // The one countdown that is allowed, because it counts toward something that genuinely
    // happens: loadRun sweeps a run with no heartbeat for 120s, and says why.
    var stale = q('[data-qc="prog-stale"]');
    if(stale){
      var age = prog.heartbeatAgeMs, left = prog.staleInMs;
      if(!isFailed && age != null && left != null && age > 60000){
        stale.textContent = 'NO DIMENSION HAS LANDED FOR ' + Math.round(age/1000) + 'S. IF NOTHING '+
          'LANDS WITHIN ' + Math.round(left/1000) + 'S THIS RUN WILL BE DECLARED DEAD AND WILL SAY WHY.';
        stale.removeAttribute('hidden');
      } else stale.setAttribute('hidden','');
    }

    (prog.dimensions || []).forEach(function(d){
      var row = scr.querySelector('[data-dim="' + d.id + '"]');
      if(!row) return;
      var ring = row.querySelector('[data-qc="ring"]');
      var st   = row.querySelector('[data-qc="state"]');
      var done = d.state === 'scored';
      var live = !isFailed && d.id === prog.currentDimensionId && prog.phase === 'dimensions';

      row.style.opacity = done ? '1' : '.55';
      if(ring){
        ring.style.borderColor = done ? 'var(--qc-elite)'
                               : (isFailed ? 'var(--qc-fail)' : 'var(--qc-rule-strong)');
        ring.style.color = 'var(--qc-elite)';
        // Only a landed dimension gets the tick. Setting it every paint is idempotent, and
        // clearing it matters for the retry path, where rows go back to pending.
        var has = ring.firstChild;
        if(done && !has) ring.innerHTML = TICK;
        else if(!done && has) ring.innerHTML = '';
      }
      if(st){
        // Deliberately NOT a score. Rows committed mid-run are pre-arithmetic: computeTotal can
        // still promote a maximum, scale a score, or floor one to 0 on a non-recoverable cap. A
        // number that later changes is the one thing this project does not print.
        st.textContent = done ? 'SCORED' : (isFailed ? 'NOT SCORED' : (live ? 'SCORING…' : 'QUEUED'));
        st.style.color = done ? 'var(--qc-elite)'
                       : (isFailed ? 'var(--qc-ink-dim)' : (live ? '#6F00FF' : 'var(--qc-ink-dim)'));
      }
    });

    // The spinner belongs on the work actually happening. During the fact pass no dimension is
    // being scored, so putting it on row 01 would be a lie for the ~30s that matters most.
    if(isFailed) spinOn(null);
    else if(prog.phase === 'dimensions' && prog.currentDimensionId)
      spinOn(scr.querySelector('[data-dim="' + prog.currentDimensionId + '"] [data-qc="ring"]'));
    else spinOn(q('[data-qc="phase-ring"]'));

    if(isFailed) showError(reason);
  }

  // ---------------------------------------------------------------- the failure card
  var err = q('[data-qc="prog-error"]');
  function showError(reason){
    if(!err) return;
    err.removeAttribute('hidden');
    var whole = String(reason || '');
    var cut = whole.indexOf(': ');
    var code = cut > 0 ? whole.slice(0, cut) : 'failed';
    var why  = cut > 0 ? whole.slice(cut + 2) : (whole || 'No reason was recorded.');
    set('[data-qc="prog-error-code"]', code.toUpperCase() + '  ·  RUN #' + C.code);
    var body = q('[data-qc="prog-error-body"]');
    if(body){
      body.style.cssText = 'max-width:70ch;font:400 12.5px/1.65 var(--qc-body);color:var(--qc-ink-muted)';
      body.textContent = why + ' Scores are not shown for a partial run: a dimension’s final ' +
        'score depends on arithmetic that runs only once all twelve have landed.';
    }
    var retry = q('[data-qc="retry"]');
    if(retry) retry.onclick = function(){ location.href = '/new'; };
    var diag = q('[data-qc="copy-diag"]');
    if(diag) diag.onclick = function(){
      qcCopy('run ' + C.runId + '\n' + C.callType + ' · transcript ' + C.code + '\n' + whole,
             diag, 'Copied');
    };
  }
  if(err && !C.failed) err.setAttribute('hidden','');

  paint(P, C.failed, C.failureReason);

  // ---------------------------------------------------------------- polling
  //
  // Replaces setTimeout(location.reload, 5000). The served page is ~429KB and a 243s run reloaded
  // it ~48 times — roughly 20MB, plus a scroll reset and a re-triggered font load each time, to
  // say "5 of 12". The JSON this polls is ~900 bytes.
  var POLL_MS = 5000, fails = 0, timer = null, stopped = false, lastOkAt = Date.now();

  function schedule(){
    if(stopped || document.visibilityState === 'hidden') return;
    timer = setTimeout(tick, POLL_MS * Math.min(Math.pow(2, fails), 6));
  }

  function degrade(){
    var since = Math.round((Date.now() - lastOkAt)/1000);
    if(fails < 3){ set('[data-qc="eta-basis"]', 'last checked ' + since + 's ago'); return; }
    // A spinner still turning while the page has no idea what is happening IS the forever-spinner
    // the brief forbids — at the network layer rather than the worker layer. Stop it and say so.
    spinOn(null);
    set('[data-qc="phase-text"]', 'CANNOT REACH THE SERVER');
    set('[data-qc="eta-text"]', '');
    set('[data-qc="eta-basis"]',
        'last successful check ' + since + 's ago · scoring is unaffected, it runs on the server');
  }

  function tick(){
    fetch('/api/runs/' + C.runId, { cache:'no-store', headers:{ Accept:'application/json' } })
      .then(function(r){
        if(r.status === 404){ stopped = true; return null; }   // terminal; do not retry forever
        if(!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(j){
        if(!j) return;
        fails = 0; lastOkAt = Date.now();
        // A terminal state is rendered by the SERVER — renderReport for a finished run, the
        // sweep's own message for a dead one. Rebuilding either here would duplicate the
        // renderer, which is the drift this file exists to prevent. One reload is the right price.
        if(j.status !== 'running'){ stopped = true; location.reload(); return; }
        if(j.progress) paint(j.progress, false, null);
      })
      .catch(function(e){
        // console.warn, never console.error: test/browser/app.py fails the whole suite on any
        // console error, and the offline test would fail its own assertion.
        fails++; console.warn('poll failed: ' + e); degrade();
      })
      .then(schedule);
  }

  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'visible' && !stopped){ clearTimeout(timer); tick(); }
  });

  // The client never decides a run is dead. The stale sweep lives in loadRun and runs on read, so
  // the next poll simply comes back failed. Two authorities on liveness would eventually
  // disagree, on the one screen whose job is to never be ambiguous.
  if(!C.failed) schedule();
})();
` + REDIRECT_HOME;

  return inject(page(), only("3c", script, SPINNER_CSS));
}
