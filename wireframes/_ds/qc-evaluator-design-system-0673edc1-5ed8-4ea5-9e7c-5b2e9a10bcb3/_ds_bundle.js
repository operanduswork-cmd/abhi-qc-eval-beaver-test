/* @ds-bundle: {"format":4,"namespace":"QCEvaluatorDesignSystem_0673ed","components":[{"name":"KickOffIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"CoachingIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"ContradictionIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"EvidenceIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"TranscriptIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"TalkShareIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"CapIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"VerifiedIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"FailedIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"CapFiredIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"IndeterminateIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"NotApplicableIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"NotEvidencedIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"QueuedIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"ScoringIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"DegradedIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"UnobservableIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"CompleteIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"WorkerDiedIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"DownloadIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"RetryIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"CopyIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"ChevronIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"BackIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"ExternalIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"SearchIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"MenuIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"CaretIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"AddIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"InfoIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"DiscardIcon","sourcePath":"assets/icons/icons.tsx"},{"name":"QcMark","sourcePath":"assets/icons/icons.tsx"},{"name":"Button","sourcePath":"components/controls/Button.jsx"},{"name":"Input","sourcePath":"components/controls/Input.jsx"},{"name":"CapNotice","sourcePath":"components/evidence/CapNotice.jsx"},{"name":"EvidenceCitation","sourcePath":"components/evidence/EvidenceCitation.jsx"},{"name":"UnobservableNotice","sourcePath":"components/evidence/UnobservableNotice.jsx"},{"name":"QC_ICONS","sourcePath":"components/icon/Icon.jsx"},{"name":"Icon","sourcePath":"components/icon/Icon.jsx"},{"name":"ProgressRow","sourcePath":"components/progress/ProgressRow.jsx"},{"name":"RubricCard","sourcePath":"components/rubric/RubricCard.jsx"},{"name":"BandRail","sourcePath":"components/scoring/BandRail.jsx"},{"name":"ScoreChip","sourcePath":"components/scoring/ScoreChip.jsx"}],"sourceHashes":{"assets/icons/icons.tsx":"39c739126a16","components/controls/Button.jsx":"ac7f81399990","components/controls/Input.jsx":"d039539232b0","components/evidence/CapNotice.jsx":"98047ea6ec85","components/evidence/EvidenceCitation.jsx":"7029dd5c8cfd","components/evidence/UnobservableNotice.jsx":"40cbe1374193","components/icon/Icon.jsx":"244ff13e25c3","components/progress/ProgressRow.jsx":"6bbb27c7932e","components/rubric/RubricCard.jsx":"95edf28b7854","components/scoring/BandRail.jsx":"f1e1e548d234","components/scoring/ScoreChip.jsx":"22a39bc61da9","ui_kits/qc-evaluator-app/AppChrome.jsx":"f03a494b3dc1","ui_kits/qc-evaluator-app/LandingScreen.jsx":"902841fb69f5","ui_kits/qc-evaluator-app/ProgressScreen.jsx":"5e83de28f2cf","ui_kits/qc-evaluator-app/ReportScreen.jsx":"2f95224d478a","ui_kits/qc-evaluator-app/RunFormScreen.jsx":"6aeb75329506","ui_kits/qc-evaluator-app/data.js":"aab634dc049c"},"inlinedExternals":[],"unexposedExports":[{"name":"bandFor","sourcePath":"components/scoring/ScoreChip.jsx"}]} */

(() => {

const __ds_ns = (window.QCEvaluatorDesignSystem_0673ed = window.QCEvaluatorDesignSystem_0673ed || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// assets/icons/icons.tsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * QC Evaluator — icon set
 *
 * 24×24 viewBox · 1.25px stroke · round caps · fill:none · currentColor.
 * Weight comes from SIZE, not stroke. Render 18px in rows, 16px in buttons
 * (bump to strokeWidth 1.6 at 16px for optical weight).
 *
 * fill="none" and stroke="currentColor" are a PAIR — drop either and the
 * glyph vanishes silently, with no console error.
 */

function Icon({
  size = 18,
  strokeWidth,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth ?? (size <= 16 ? 1.6 : 1.25),
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, rest), children);
}

/* ── rubric types ─────────────────────────────────────────────────────────── */

const KickOffIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M8.5 5.2 18 12l-9.5 6.8V5.2Z"
}));
const CoachingIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M20.5 11.4c0 3.9-3.8 7-8.5 7-1 0-2-.14-2.9-.4L4 20l1.5-3.6C4.4 15.1 3.5 13.4 3.5 11.4c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7Z"
}));

/* ── domain ───────────────────────────────────────────────────────────────── */

/** Two opposing arrows on offset baselines — deliberately NOT crossing.
 *  Crossing reads as "cancelled"; offset-and-opposed reads as "both are on
 *  the record and they point different ways", which is what the report says. */
const ContradictionIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M3.5 8.5h11.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M11.5 5 15 8.5 11.5 12"
}), /*#__PURE__*/React.createElement("path", {
  d: "M20.5 16h-11.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12.5 12.5 9 16l3.5 3.5"
}));
const EvidenceIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M5 4.5v15"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9 7.5h10.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9 12h10.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9 16.5h6"
}));
const TranscriptIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M6.5 3.5h7L18 8v12.5H6.5V3.5Z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M13.4 3.6V8H18"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9.5 13h5.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9.5 16.5h4"
}));
const TalkShareIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M3.5 9h12"
}), /*#__PURE__*/React.createElement("path", {
  d: "M3.5 15h6"
}), /*#__PURE__*/React.createElement("path", {
  d: "M20 4.5v15"
}));
const CapIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M5 4.5v15"
}), /*#__PURE__*/React.createElement("path", {
  d: "M5 4.5h11l-2 3.2 2 3.2H5"
}));

/* ── status ───────────────────────────────────────────────────────────────── */

const VerifiedIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M4.5 12.5 9.5 17.5 19.5 6.5"
}));
const FailedIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M6.5 6.5l11 11"
}), /*#__PURE__*/React.createElement("path", {
  d: "M17.5 6.5l-11 11"
}));
const CapFiredIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M12 4 21.5 20H2.5L12 4Z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 10v4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 16.8v.1"
}));

/** NOT a warning triangle. The system looked and could not verify — different
 *  from something being wrong. Renders in brand navy, never red. */
const IndeterminateIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "8.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9.6 9.5a2.5 2.5 0 1 1 3.2 2.6c-.6.25-.85.7-.85 1.3v.4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 17v.1"
}));
const NotApplicableIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M6 12h12"
}));
const NotEvidencedIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "8",
  strokeDasharray: "3 3"
}));
const QueuedIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "8.2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 7.5V12l3 1.8"
}));

/** Static open arc. Does NOT spin — progress is a twelve-row manifest, and a
 *  spinner is what you show when you have nothing to report. */
const ScoringIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M12 3.8a8.2 8.2 0 1 1-5.8 2.4"
}));
const DegradedIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M12 4v3.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 16.5V20"
}), /*#__PURE__*/React.createElement("path", {
  d: "M4 12h3.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M16.5 12H20"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "3.2"
}));
const UnobservableIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M3.5 12S7 6.5 12 6.5 20.5 12 20.5 12 17 17.5 12 17.5 3.5 12 3.5 12Z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M4.5 4.5 19.5 19.5"
}));
const CompleteIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M3 12.5 8 17.5 18 6.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12.5 17.5 21 8"
}));
const WorkerDiedIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "8.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M18 6 6 18"
}));

/* ── controls ─────────────────────────────────────────────────────────────── */

const DownloadIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M12 4v10.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M7.5 10.5 12 15l4.5-4.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M4.5 19.5h15"
}));
const RetryIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M19.8 10.2A8 8 0 0 0 6 6.4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M4.2 13.8a8 8 0 0 0 13.6 3.6"
}), /*#__PURE__*/React.createElement("path", {
  d: "M5.5 4v3.4h3.4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M18.5 20v-3.4h-3.4"
}));
const CopyIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M8.5 8.5V5h10v10h-3.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M5.5 8.5h10v10h-10v-10Z"
}));

/** Rotates 90° on expand over 220ms. */
const ChevronIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M10 6.5 15.5 12 10 17.5"
}));
const BackIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M19.5 12H5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M10.5 6.5 5 12l5.5 5.5"
}));
const ExternalIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M9 5.5h9.5V15"
}), /*#__PURE__*/React.createElement("path", {
  d: "M18.5 5.5 6 18"
}));
const SearchIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
  cx: "10.5",
  cy: "10.5",
  r: "6.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M15.2 15.2 20 20"
}));
const MenuIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M4.5 7.5h15"
}), /*#__PURE__*/React.createElement("path", {
  d: "M4.5 12h15"
}), /*#__PURE__*/React.createElement("path", {
  d: "M4.5 16.5h9"
}));
const CaretIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M12 15 6.5 9.5h11L12 15Z"
}));
const AddIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M12 5v14"
}), /*#__PURE__*/React.createElement("path", {
  d: "M5 12h14"
}));
const InfoIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "8.2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 16.2v-4.6"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 8.2v.1"
}));
const DiscardIcon = p => /*#__PURE__*/React.createElement(Icon, p, /*#__PURE__*/React.createElement("path", {
  d: "M4.5 6.5h15"
}), /*#__PURE__*/React.createElement("path", {
  d: "M8 6.5V4.5h8v2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M6.5 6.5 7.5 20h9l1-13.5"
}));

/* ── brand ────────────────────────────────────────────────────────────────── */

/** The gutter: a citation rule, two lines that align to it, and one that
 *  does not — detached and offset. That misalignment is the product. */
const QcMark = ({
  size = 32,
  ...rest
}) => /*#__PURE__*/React.createElement("svg", _extends({
  width: size,
  height: size,
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  role: "img",
  "aria-label": "QC Evaluator"
}, rest), /*#__PURE__*/React.createElement("path", {
  d: "M8 6v20"
}), /*#__PURE__*/React.createElement("path", {
  d: "M13 11h14"
}), /*#__PURE__*/React.createElement("path", {
  d: "M13 16.5h10"
}), /*#__PURE__*/React.createElement("path", {
  d: "M16 22h11"
}));
Object.assign(__ds_scope, { KickOffIcon, CoachingIcon, ContradictionIcon, EvidenceIcon, TranscriptIcon, TalkShareIcon, CapIcon, VerifiedIcon, FailedIcon, CapFiredIcon, IndeterminateIcon, NotApplicableIcon, NotEvidencedIcon, QueuedIcon, ScoringIcon, DegradedIcon, UnobservableIcon, CompleteIcon, WorkerDiedIcon, DownloadIcon, RetryIcon, CopyIcon, ChevronIcon, BackIcon, ExternalIcon, SearchIcon, MenuIcon, CaretIcon, AddIcon, InfoIcon, DiscardIcon, QcMark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/icons/icons.tsx", error: String((e && e.message) || e) }); }

// components/evidence/EvidenceCitation.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* The signature element. Gutter 42px, mono 11px, full-strength brand navy
   (or --qc-fail when contradicting). Quote: system 14px/1.55, max 62ch, behind
   a 2px left rule at 18px padding.

   Line numbers are derived IN CODE from where the quote was located — never
   taken from the model. Render the ORIGINAL span, never a normalised string,
   or a grader diffing the report against the transcript concludes you
   fabricated it. */

function EvidenceCitation({
  line,
  speaker,
  quote,
  contradicts,
  degraded = false,
  style,
  ...rest
}) {
  const tone = contradicts ? 'var(--qc-fail)' : degraded ? 'var(--qc-ink-dim)' : 'var(--qc-brand)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 18,
      opacity: degraded ? .7 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 11,
      color: tone,
      width: 42,
      flexShrink: 0,
      paddingTop: 2
    }
  }, line), /*#__PURE__*/React.createElement("div", {
    style: {
      borderLeft: degraded ? '2px dashed var(--qc-rule-strong)' : `2px solid ${contradicts ? 'var(--qc-fail)' : 'var(--qc-rule-strong)'}`,
      paddingLeft: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 9.5,
      letterSpacing: '.16em',
      textTransform: 'uppercase',
      color: 'var(--qc-ink-dim)',
      marginBottom: 6
    }
  }, speaker, contradicts ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--qc-fail)'
    }
  }, '\u00A0\u00A0·\u00A0\u00A0contradicts ' + contradicts) : null, degraded ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--qc-inconsistent)'
    }
  }, '\u00A0\u00A0·\u00A0\u00A0degraded — contains [inaudible]') : null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 14,
      lineHeight: 1.55,
      maxWidth: '62ch',
      color: degraded ? 'var(--qc-ink-muted)' : 'var(--qc-brand)'
    }
  }, '\u201C' + quote + '\u201D')));
}
Object.assign(__ds_scope, { EvidenceCitation });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/evidence/EvidenceCitation.jsx", error: String((e && e.message) || e) }); }

// components/icon/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* 24×24 viewBox · 1.25px stroke · round caps · fill:none · currentColor.
   Paths are the QC Evaluator set verbatim (assets/icons/icons.tsx is the
   TypeScript original; assets/icons/icons.svg the sprite for non-React use).
   fill="none" and stroke="currentColor" are a PAIR — drop either and the
   glyph vanishes silently, with no console error. */

const P = (d, i) => React.createElement('path', {
  key: 'p' + i,
  d
});
const C = (cx, cy, r, extra, i) => React.createElement('circle', {
  key: 'c' + i,
  cx,
  cy,
  r,
  ...extra
});
const QC_ICONS = {
  /* rubric types */
  'kick-off': ['M8.5 5.2 18 12l-9.5 6.8V5.2Z'],
  'coaching': ['M20.5 11.4c0 3.9-3.8 7-8.5 7-1 0-2-.14-2.9-.4L4 20l1.5-3.6C4.4 15.1 3.5 13.4 3.5 11.4c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7Z'],
  /* domain — the ones no library ships */
  'contradiction': ['M3.5 8.5h11.5', 'M11.5 5 15 8.5 11.5 12', 'M20.5 16h-11.5', 'M12.5 12.5 9 16l3.5 3.5'],
  'evidence': ['M5 4.5v15', 'M9 7.5h10.5', 'M9 12h10.5', 'M9 16.5h6'],
  'transcript': ['M6.5 3.5h7L18 8v12.5H6.5V3.5Z', 'M13.4 3.6V8H18', 'M9.5 13h5.5', 'M9.5 16.5h4'],
  'talk-share': ['M3.5 9h12', 'M3.5 15h6', 'M20 4.5v15'],
  'cap': ['M5 4.5v15', 'M5 4.5h11l-2 3.2 2 3.2H5'],
  /* status */
  'verified': ['M4.5 12.5 9.5 17.5 19.5 6.5'],
  'failed': ['M6.5 6.5l11 11', 'M17.5 6.5l-11 11'],
  'cap-fired': ['M12 4 21.5 20H2.5L12 4Z', 'M12 10v4', 'M12 16.8v.1'],
  'indeterminate': [{
    circle: [12, 12, 8.5]
  }, 'M9.6 9.5a2.5 2.5 0 1 1 3.2 2.6c-.6.25-.85.7-.85 1.3v.4', 'M12 17v.1'],
  'not-applicable': ['M6 12h12'],
  'not-evidenced': [{
    circle: [12, 12, 8],
    dash: '3 3'
  }],
  'queued': [{
    circle: [12, 12, 8.2]
  }, 'M12 7.5V12l3 1.8'],
  'scoring': ['M12 3.8a8.2 8.2 0 1 1-5.8 2.4'],
  'degraded': ['M12 4v3.5', 'M12 16.5V20', 'M4 12h3.5', 'M16.5 12H20', {
    circle: [12, 12, 3.2]
  }],
  'unobservable': ['M3.5 12S7 6.5 12 6.5 20.5 12 20.5 12 17 17.5 12 17.5 3.5 12 3.5 12Z', 'M4.5 4.5 19.5 19.5'],
  'complete': ['M3 12.5 8 17.5 18 6.5', 'M12.5 17.5 21 8'],
  'worker-died': [{
    circle: [12, 12, 8.5]
  }, 'M18 6 6 18'],
  /* controls */
  'download': ['M12 4v10.5', 'M7.5 10.5 12 15l4.5-4.5', 'M4.5 19.5h15'],
  'retry': ['M19.8 10.2A8 8 0 0 0 6 6.4', 'M4.2 13.8a8 8 0 0 0 13.6 3.6', 'M5.5 4v3.4h3.4', 'M18.5 20v-3.4h-3.4'],
  'copy': ['M8.5 8.5V5h10v10h-3.5', 'M5.5 8.5h10v10h-10v-10Z'],
  'chevron': ['M10 6.5 15.5 12 10 17.5'],
  'back': ['M19.5 12H5', 'M10.5 6.5 5 12l5.5 5.5'],
  'external': ['M9 5.5h9.5V15', 'M18.5 5.5 6 18'],
  'search': [{
    circle: [10.5, 10.5, 6.5]
  }, 'M15.2 15.2 20 20'],
  'menu': ['M4.5 7.5h15', 'M4.5 12h15', 'M4.5 16.5h9'],
  'caret': ['M12 15 6.5 9.5h11L12 15Z'],
  'add': ['M12 5v14', 'M5 12h14'],
  'info': [{
    circle: [12, 12, 8.2]
  }, 'M12 16.2v-4.6', 'M12 8.2v.1'],
  'discard': ['M4.5 6.5h15', 'M8 6.5V4.5h8v2', 'M6.5 6.5 7.5 20h9l1-13.5']
};
function Icon({
  name,
  size = 18,
  strokeWidth,
  style,
  ...rest
}) {
  const parts = QC_ICONS[name];
  if (!parts) return null;
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth ?? (size <= 16 ? 1.6 : 1.25),
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    style: {
      flexShrink: 0,
      display: 'block',
      ...style
    }
  }, rest), parts.map((p, i) => typeof p === 'string' ? P(p, i) : C(p.circle[0], p.circle[1], p.circle[2], p.dash ? {
    strokeDasharray: p.dash
  } : {}, i)));
}
Object.assign(__ds_scope, { QC_ICONS, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icon/Icon.jsx", error: String((e && e.message) || e) }); }

// components/controls/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Height 40px, radius 6px, label 13px/600 at +.01em.
   Exactly one filled button per screen. Everything else outlined or ghost. */

const SIZES = {
  small: {
    height: 32,
    radius: 5,
    font: 12,
    track: '.02em',
    pad: 14,
    icon: 14
  },
  default: {
    height: 40,
    radius: 6,
    font: 13,
    track: '.01em',
    pad: 20,
    icon: 16
  },
  large: {
    height: 48,
    radius: 7,
    font: 14,
    track: '0em',
    pad: 26,
    icon: 18
  }
};
function Button({
  variant = 'primary',
  size = 'default',
  icon,
  iconRight,
  disabled = false,
  children,
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.default;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    boxSizing: 'border-box',
    height: s.height,
    border: 0,
    borderRadius: variant === 'ghost' ? 0 : s.radius,
    fontFamily: 'var(--qc-body)',
    fontSize: s.font,
    letterSpacing: s.track,
    background: 'transparent',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? .4 : 1,
    transition: 'background var(--qc-duration) var(--qc-ease), border-color var(--qc-duration) var(--qc-ease), color var(--qc-duration) var(--qc-ease)'
  };
  const variants = {
    primary: {
      background: 'var(--qc-brand)',
      color: '#fff',
      fontWeight: 600,
      padding: `0 ${s.pad}px`
    },
    secondary: {
      border: '1px solid var(--qc-rule-strong)',
      color: 'var(--qc-brand)',
      fontWeight: 500,
      padding: `0 ${s.pad - 2}px`
    },
    ghost: {
      color: 'var(--qc-ink-muted)',
      fontWeight: 400,
      padding: `0 ${s.pad - 6}px`
    }
  };
  const [hover, setHover] = React.useState(false);
  const hoverStyle = disabled || !hover ? null : variant === 'primary' ? {
    background: 'var(--qc-brand-hi)'
  } : variant === 'secondary' ? {
    borderColor: 'var(--qc-brand)'
  } : {
    color: 'var(--qc-brand)'
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      ...base,
      ...variants[variant],
      ...hoverStyle,
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.icon
  }) : null, children, iconRight ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.icon
  }) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/controls/Button.jsx", error: String((e && e.message) || e) }); }

// components/controls/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* 40px, radius 6, --qc-sunk fill, 1px --qc-rule. A form field, not a document
   surface — the transcript textarea is a different object (see the Run form
   screen in the app UI kit). */

function Input({
  value,
  placeholder,
  icon,
  suffix,
  label,
  disabled = false,
  style,
  ...rest
}) {
  const field = /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      boxSizing: 'border-box',
      height: 40,
      padding: '0 14px',
      borderRadius: 6,
      background: 'var(--qc-sunk)',
      border: '1px solid var(--qc-rule)',
      color: 'var(--qc-ink-dim)',
      opacity: disabled ? .4 : 1,
      transition: 'border-color var(--qc-duration) var(--qc-ease)',
      ...style
    }
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14
  }) : null, /*#__PURE__*/React.createElement("input", _extends({
    readOnly: true,
    value: value ?? '',
    placeholder: placeholder,
    disabled: disabled,
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      outline: 0,
      background: 'transparent',
      fontFamily: 'var(--qc-body)',
      fontSize: 13,
      color: value ? 'var(--qc-brand)' : 'var(--qc-ink-dim)'
    }
  }, rest)), suffix ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 10,
      letterSpacing: '.12em',
      color: 'var(--qc-ink-dim)'
    }
  }, suffix) : null);
  if (!label) return field;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 10,
      letterSpacing: '.12em',
      textTransform: 'uppercase',
      color: 'var(--qc-ink-dim)',
      marginBottom: 8
    }
  }, label), field);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/controls/Input.jsx", error: String((e && e.message) || e) }); }

// components/evidence/CapNotice.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Three states, not a boolean. border-left 3px, padding 14px 18px,
   label column 118px in mono 10px +.12em.

   The third state is load-bearing: a boolean cannot describe a call where a
   time is agreed at L188 and withdrawn at L193. The report has to say
   "cannot verify" and name which branch it scored. */

const STATES = {
  FIRED: {
    border: 'var(--qc-fail)',
    fill: 'var(--qc-fail-tint)',
    label: 'var(--qc-fail)',
    glyph: 'cap-fired'
  },
  INDETERMINATE: {
    border: 'var(--qc-brand)',
    fill: 'var(--qc-brand-tint)',
    label: 'var(--qc-brand)',
    glyph: 'indeterminate'
  },
  NOT_FIRED: {
    border: 'var(--qc-rule-strong)',
    fill: 'transparent',
    label: 'var(--qc-ink-dim)',
    glyph: null
  }
};
const LABELS = {
  FIRED: 'FIRED',
  INDETERMINATE: 'INDETERMINATE',
  NOT_FIRED: 'NOT FIRED'
};
function CapNotice({
  state = 'NOT_FIRED',
  showGlyph = true,
  children,
  style,
  ...rest
}) {
  const s = STATES[state] || STATES.NOT_FIRED;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 14,
      background: s.fill,
      borderLeft: `3px solid ${s.border}`,
      padding: '14px 18px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      width: 118,
      flexShrink: 0,
      paddingTop: 2,
      color: s.label
    }
  }, showGlyph && s.glyph ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: s.glyph,
    size: 14
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 10,
      letterSpacing: '.12em'
    }
  }, LABELS[state])), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 13.5,
      lineHeight: 1.55,
      color: state === 'NOT_FIRED' ? 'var(--qc-ink-muted)' : 'var(--qc-brand)'
    }
  }, children));
}
Object.assign(__ds_scope, { CapNotice });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/evidence/CapNotice.jsx", error: String((e && e.message) || e) }); }

// components/evidence/UnobservableNotice.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* 1px dashed --qc-rule-strong, radius 8, --qc-raised fill, unobservable glyph,
   micro-label in brand navy. Where the rubric asks for something the format
   cannot show, the report says so instead of inferring it from tone. */

function UnobservableNotice({
  label = 'NOT OBSERVABLE IN THIS FORMAT',
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      border: '1px dashed var(--qc-rule-strong)',
      borderRadius: 8,
      padding: '16px 20px',
      background: 'var(--qc-raised)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 9,
      color: 'var(--qc-brand)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "unobservable",
    size: 14
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 9.5,
      letterSpacing: '.16em',
      textTransform: 'uppercase'
    }
  }, label)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 13.5,
      lineHeight: 1.55,
      color: 'var(--qc-ink-muted)',
      maxWidth: '68ch'
    }
  }, children));
}
Object.assign(__ds_scope, { UnobservableNotice });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/evidence/UnobservableNotice.jsx", error: String((e && e.message) || e) }); }

// components/progress/ProgressRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* padding 11px 14px · radius 6px · status glyph · index (mono 11, 20px column)
   · title · status right. Four states. Never a spinner — progress is a
   twelve-row manifest that fills in. */

const STATES = {
  done: {
    fill: 'var(--qc-raised)',
    tone: 'var(--qc-brand)',
    glyph: 'verified',
    dim: false
  },
  scoring: {
    fill: 'var(--qc-brand-tint)',
    tone: 'var(--qc-brand)',
    glyph: 'scoring',
    dim: false
  },
  queued: {
    fill: 'transparent',
    tone: 'var(--qc-ink-dim)',
    glyph: 'queued',
    dim: true
  },
  failed: {
    fill: 'var(--qc-fail-tint)',
    tone: 'var(--qc-fail)',
    glyph: 'failed',
    dim: false
  }
};
function ProgressRow({
  index,
  title,
  state = 'queued',
  status,
  statusBand,
  showGlyph = true,
  style,
  ...rest
}) {
  const s = STATES[state] || STATES.queued;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '11px 14px',
      borderRadius: 6,
      background: s.fill,
      ...style
    }
  }, rest), showGlyph ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: s.dim ? 'var(--qc-ink-dim)' : s.tone,
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: s.glyph,
    size: 16
  })) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 11,
      color: s.dim ? 'var(--qc-ink-dim)' : s.tone,
      width: 20,
      flexShrink: 0
    }
  }, index), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 13.5,
      flexGrow: 1,
      color: s.dim ? 'var(--qc-ink-dim)' : state === 'done' ? 'var(--qc-brand)' : s.tone
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 11,
      color: statusBand ? `var(--qc-${statusBand})` : s.tone,
      flexShrink: 0
    }
  }, status));
}
Object.assign(__ds_scope, { ProgressRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/progress/ProgressRow.jsx", error: String((e && e.message) || e) }); }

// components/rubric/RubricCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Two rubric cards, not a dropdown. Stacked glyph at 24px, label, ghost
   "Run →". Hairline border, --qc-raised fill, 8px radius, no shadow.
   Sales call and strategic review are out of scope — not drawn. */

function RubricCard({
  icon = 'coaching',
  label,
  meta,
  action = 'Run \u2192',
  selected = false,
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "button",
    tabIndex: disabled ? -1 : 0,
    onClick: disabled ? undefined : onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 14,
      padding: '30px 20px 22px',
      borderRadius: 8,
      background: 'var(--qc-raised)',
      border: `1px solid ${selected ? 'var(--qc-brand)' : hover && !disabled ? 'var(--qc-rule-strong)' : 'var(--qc-rule)'}`,
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? .4 : 1,
      transition: 'border-color var(--qc-duration) var(--qc-ease)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      color: selected ? 'var(--qc-brand)' : 'var(--qc-ink-dim)',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 24
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 13.5,
      fontWeight: 500,
      color: 'var(--qc-brand)'
    }
  }, label), meta ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 10,
      letterSpacing: '.12em',
      textTransform: 'uppercase',
      color: 'var(--qc-ink-dim)',
      marginTop: -6
    }
  }, meta) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 12,
      color: selected || hover ? 'var(--qc-brand)' : 'var(--qc-ink-dim)'
    }
  }, action));
}
Object.assign(__ds_scope, { RubricCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/rubric/RubricCard.jsx", error: String((e && e.message) || e) }); }

// components/scoring/BandRail.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Five segments, 6px tall, 3px gap, 2px radius, widths 60/10/10/10/10.
   The active segment takes its band colour; the rest are --qc-rule-strong.
   Replaces a gauge: shows band STRUCTURE and distance to the next band,
   not just the number that is already printed beside it. */

const SEGMENTS = [{
  key: 'fail',
  label: 'Fail',
  flex: 60,
  color: 'var(--qc-fail)'
}, {
  key: 'at-risk',
  label: 'At risk',
  flex: 10,
  color: 'var(--qc-at-risk)'
}, {
  key: 'inconsistent',
  label: 'Inconsistent',
  flex: 10,
  color: 'var(--qc-inconsistent)'
}, {
  key: 'strong',
  label: 'Strong',
  flex: 10,
  color: 'var(--qc-strong)'
}, {
  key: 'elite',
  label: 'Elite',
  flex: 10,
  color: 'var(--qc-elite)'
}];
function BandRail({
  band = 'inconsistent',
  caption,
  showLabels = true,
  style,
  ...rest
}) {
  const cols = SEGMENTS.map(s => s.flex + 'fr').join(' ');
  return /*#__PURE__*/React.createElement("div", _extends({
    style: style
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: cols,
      gap: 3
    }
  }, SEGMENTS.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.key,
    style: {
      height: 6,
      borderRadius: 2,
      background: s.key === band ? s.color : 'var(--qc-rule-strong)'
    }
  }))), showLabels ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: cols,
      gap: 3,
      marginTop: 9
    }
  }, SEGMENTS.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.key,
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 9,
      letterSpacing: '.16em',
      textTransform: 'uppercase',
      color: s.key === band ? s.color : 'var(--qc-ink-dim)'
    }
  }, s.label))) : null, caption ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 11,
      color: 'var(--qc-ink-muted)',
      marginTop: 14
    }
  }, caption) : null);
}
Object.assign(__ds_scope, { BandRail });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/scoring/BandRail.jsx", error: String((e && e.message) || e) }); }

// components/scoring/ScoreChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Mono 11px · padding 5px 11px · radius 999px. Text is the band colour, fill
   is that same colour at 12% (14% for at-risk). Right-aligned in every row.
   999px radius belongs to state chips and nothing else. */

const BANDS = {
  elite: {
    color: 'var(--qc-elite)',
    background: 'var(--qc-elite-tint)'
  },
  strong: {
    color: 'var(--qc-strong)',
    background: 'var(--qc-strong-tint)'
  },
  inconsistent: {
    color: 'var(--qc-inconsistent)',
    background: 'var(--qc-inconsistent-tint)'
  },
  'at-risk': {
    color: 'var(--qc-at-risk)',
    background: 'var(--qc-at-risk-tint)'
  },
  fail: {
    color: '#fff',
    background: 'var(--qc-fail)'
  },
  na: {
    color: 'var(--qc-ink-dim)',
    background: 'var(--qc-ink-faint)'
  },
  'not-evidenced': {
    color: 'var(--qc-ink-dim)',
    background: 'transparent',
    border: '1px dashed var(--qc-rule-strong)'
  }
};
function ScoreChip({
  band = 'strong',
  children,
  style,
  ...rest
}) {
  const b = BANDS[band] || BANDS.strong;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-block',
      fontFamily: 'var(--qc-mono)',
      fontSize: 11,
      padding: b.border ? '4px 10px' : '5px 11px',
      borderRadius: 999,
      whiteSpace: 'nowrap',
      ...b,
      ...style
    }
  }, rest), children);
}

/** 90–100 elite · 80–89 strong · 70–79 inconsistent · 60–69 at-risk · <60 fail */
function bandFor(score) {
  if (score == null) return 'na';
  if (score >= 90) return 'elite';
  if (score >= 80) return 'strong';
  if (score >= 70) return 'inconsistent';
  if (score >= 60) return 'at-risk';
  return 'fail';
}
Object.assign(__ds_scope, { ScoreChip, bandFor });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/scoring/ScoreChip.jsx", error: String((e && e.message) || e) }); }

// ui_kits/qc-evaluator-app/AppChrome.jsx
try { (() => {
const {
  Icon
} = window.QCDS;

/* ~48px bar with a hairline bottom rule. Everything low-contrast except the
   wordmark. Observed from the reference frames; the search field is 6px rather
   than the reference's pill, because 999px belongs to state chips only. */

function AppChrome({
  onHome
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 48,
      borderBottom: '1px solid var(--qc-rule)',
      background: 'var(--qc-paper)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 18px',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--qc-ink-dim)',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "menu",
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    onClick: onHome,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/qc-mark.svg",
    width: "18",
    height: "18",
    alt: ""
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 12,
      color: 'var(--qc-ink-dim)'
    }
  }, "QC Evaluator")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: 300,
      height: 28,
      padding: '0 11px',
      borderRadius: 6,
      background: 'var(--qc-sunk)',
      border: '1px solid var(--qc-rule)',
      color: 'var(--qc-ink-dim)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 13
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontFamily: 'var(--qc-body)',
      fontSize: 12
    }
  }, "Search clients\u2026"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 9.5,
      letterSpacing: '.08em',
      border: '1px solid var(--qc-rule)',
      borderRadius: 3,
      padding: '1px 4px'
    }
  }, "\u2318K"))), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--qc-ink-dim)',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 15
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 10,
      color: 'var(--qc-ink-dim)'
    }
  }, "14:37 EDT"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: 999,
      background: 'var(--qc-elite)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 9.5,
      letterSpacing: '.12em',
      color: 'var(--qc-ink-dim)'
    }
  }, "LIVE")), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      borderRadius: 999,
      border: '1px solid var(--qc-rule-strong)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--qc-body)',
      fontSize: 10,
      color: 'var(--qc-ink-muted)'
    }
  }, "P"));
}

/* Region label used across every screen. */
function MicroLabel({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 9.5,
      letterSpacing: '.16em',
      textTransform: 'uppercase',
      color: 'var(--qc-ink-dim)',
      ...style
    }
  }, children);
}
function Page({
  children,
  width = 1152
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: width,
      margin: '0 auto',
      padding: '40px 32px 88px'
    }
  }, children);
}
Object.assign(window, {
  AppChrome,
  MicroLabel,
  Page
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/qc-evaluator-app/AppChrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/qc-evaluator-app/LandingScreen.jsx
try { (() => {
const {
  Button,
  ScoreChip
} = window.QCDS;

/* P1 — left-aligned, single column, no hero image. One action. */

function LandingScreen({
  onStart
}) {
  return /*#__PURE__*/React.createElement(Page, {
    width: 1152
  }, /*#__PURE__*/React.createElement(MicroLabel, null, "QC Evaluator \xA0\xB7\xA0 stage 2"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--qc-display)',
      fontWeight: 600,
      fontSize: 62,
      lineHeight: .98,
      letterSpacing: '-.045em',
      margin: '20px 0 0',
      maxWidth: '18ch'
    }
  }, "Score one call at a time, against its rubric."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--qc-ink-muted)',
      maxWidth: '62ch',
      margin: '24px 0 0'
    }
  }, "Paste a transcript. Every dimension comes back with the verbatim lines it was scored on and the line number those lines sit at. Where the transcript cannot answer the rubric, the report says so instead of guessing."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 34,
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "large",
    onClick: onStart
  }, "Run an evaluation"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    iconRight: "external"
  }, "Read the rubric")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 72,
      paddingTop: 30,
      borderTop: '1px solid var(--qc-rule)',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 40,
      maxWidth: 940
    }
  }, [['Evidence or nothing', 'Every score carries the lines it came from. Absent behaviour is stated, never inferred from tone.'], ['Absent is never zero', 'NOT EVIDENCED, N/A and INDETERMINATE are distinct rendered states, not a missing value.'], ['Every run has a URL', 'Shareable without a login, and it still resolves next week.']].map(([h, b]) => /*#__PURE__*/React.createElement("div", {
    key: h
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontWeight: 600,
      fontSize: 14,
      marginBottom: 9
    }
  }, h), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 13,
      lineHeight: 1.6,
      color: 'var(--qc-ink-muted)'
    }
  }, b)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 44,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      maxWidth: 620
    }
  }, /*#__PURE__*/React.createElement(MicroLabel, {
    style: {
      marginBottom: 12
    }
  }, "Recent runs"), [['coaching-01', 'Malik Osei', '78', 'inconsistent'], ['coaching-04', 'Dana Whitfield', '91', 'elite'], ['kickoff-11', 'Sam Okonkwo', '64', 'at-risk']].map(([id, name, s, band]) => /*#__PURE__*/React.createElement("div", {
    key: id,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '11px 14px',
      borderRadius: 6,
      background: 'var(--qc-raised)',
      border: '1px solid var(--qc-rule)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 11,
      color: 'var(--qc-ink-dim)',
      width: 92
    }
  }, id), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 13.5,
      flex: 1
    }
  }, name), /*#__PURE__*/React.createElement(ScoreChip, {
    band: band
  }, s)))));
}
Object.assign(window, {
  LandingScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/qc-evaluator-app/LandingScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/qc-evaluator-app/ProgressScreen.jsx
try { (() => {
const {
  Button,
  ProgressRow,
  Icon
} = window.QCDS;

/* P3 — a twelve-row manifest that fills in. NEVER a spinner. Failure names the
   error_code and explains it in plain English in the same frame. */

function ProgressScreen({
  onDone,
  onRetry
}) {
  const run = window.QC_RUN;
  const [step, setStep] = React.useState(0);
  const failed = step >= 12;
  React.useEffect(() => {
    if (step > 12) return;
    const t = setTimeout(() => setStep(s => s + 1), step === 0 ? 500 : 620);
    return () => clearTimeout(t);
  }, [step]);
  const stateFor = i => {
    if (i === 9 && step > 9) return 'failed';
    if (i < step) return 'done';
    if (i === step) return 'scoring';
    return 'queued';
  };
  const statusFor = i => {
    const st = stateFor(i);
    if (st === 'failed') return 'failed';
    if (st === 'done') return run.dimensions[i].score;
    if (st === 'scoring') return 'scoring\u2026';
    return 'queued';
  };
  return /*#__PURE__*/React.createElement(Page, {
    width: 860
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    icon: "back",
    style: {
      padding: 0,
      marginBottom: 26
    }
  }, "Back"), /*#__PURE__*/React.createElement(MicroLabel, null, run.id, " \xA0\xB7\xA0 run ", run.runId), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--qc-display)',
      fontWeight: 600,
      fontSize: 44,
      lineHeight: 1,
      letterSpacing: '-.04em',
      margin: '18px 0 0'
    }
  }, "Scoring ", run.coachee), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 14,
      color: 'var(--qc-ink-muted)',
      marginTop: 12
    }
  }, "Twelve dimensions, each verified against the transcript before it is scored."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 14,
      marginTop: 34
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 11,
      color: 'var(--qc-brand)'
    }
  }, Math.min(step, 12), " / 12 complete"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 11,
      color: 'var(--qc-ink-dim)'
    }
  }, "no spinner \u2014 this list is the progress")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      marginTop: 16
    }
  }, run.manifest.map((title, i) => /*#__PURE__*/React.createElement(ProgressRow, {
    key: title,
    index: String(i + 1).padStart(2, '0'),
    title: title,
    state: stateFor(i),
    status: statusFor(i),
    statusBand: stateFor(i) === 'done' ? run.dimensions[i].band : undefined
  }))), failed ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 26,
      background: 'var(--qc-fail-tint)',
      borderLeft: '3px solid var(--qc-fail)',
      padding: '16px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      color: 'var(--qc-fail)',
      marginBottom: 9
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "failed",
    size: 14
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 10,
      letterSpacing: '.12em'
    }
  }, "EVIDENCE_NOT_FOUND \xA0\xB7\xA0 D10")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 13.5,
      lineHeight: 1.6,
      color: 'var(--qc-brand)',
      maxWidth: '68ch'
    }
  }, "Two quotes about the next call were located and both verified against the transcript, and they contradict each other. The dimension cannot be scored from evidence, so it was not guessed. The report renders both lines and marks the booking cap indeterminate."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "retry",
    onClick: onRetry
  }, "Retry this run"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    icon: "copy"
  }, "Copy diagnostics"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    iconRight: "chevron",
    onClick: onDone
  }, "Open the report anyway"))) : null);
}
Object.assign(window, {
  ProgressScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/qc-evaluator-app/ProgressScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/qc-evaluator-app/ReportScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Button,
  ScoreChip,
  BandRail,
  CapNotice,
  EvidenceCitation,
  UnobservableNotice,
  Icon
} = window.QCDS;

/* P4 — fixed order: identity → score → caps → the one thing → the brief →
   red flags → twelve dimension rows. Caps sit ABOVE the dimension list as
   first-class objects. Collapsed rows fade under a gradient mask rather than
   truncating with an ellipsis. */

function DimensionRow({
  d,
  open,
  onToggle
}) {
  const dimmed = d.band === 'na' || d.band === 'not-evidenced';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--qc-raised)',
      border: '1px solid var(--qc-rule)',
      borderRadius: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onToggle,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '15px 18px',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 11,
      color: 'var(--qc-ink-dim)',
      width: 20
    }
  }, d.i), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontWeight: 600,
      fontSize: 16,
      flex: 1,
      color: dimmed ? 'var(--qc-ink-muted)' : 'var(--qc-brand)'
    }
  }, d.title), d.mono ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 11,
      color: 'var(--qc-ink-dim)'
    }
  }, d.mono) : null, /*#__PURE__*/React.createElement(ScoreChip, {
    band: d.band
  }, d.score), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--qc-ink-dim)',
      display: 'flex',
      transform: open ? 'rotate(90deg)' : 'none',
      transition: 'transform var(--qc-duration-disclosure) var(--qc-ease)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron",
    size: 16
  }))), open ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 18px 20px 54px'
    }
  }, d.reasoning ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 14,
      lineHeight: 1.6,
      color: 'var(--qc-ink-muted)',
      maxWidth: '68ch'
    }
  }, d.reasoning) : null, d.evidence ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(MicroLabel, {
    style: {
      marginBottom: 14
    }
  }, "Evidence"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, d.evidence.map(e => /*#__PURE__*/React.createElement(EvidenceCitation, _extends({
    key: e.line
  }, e))))) : null, d.quickFix ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      background: 'var(--qc-sunk)',
      borderRadius: 6,
      padding: '14px 18px',
      maxWidth: '68ch'
    }
  }, /*#__PURE__*/React.createElement(MicroLabel, {
    style: {
      marginBottom: 8
    }
  }, "Quick fix"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 13.5,
      lineHeight: 1.6,
      color: 'var(--qc-brand)'
    }
  }, d.quickFix)) : null, d.unobservable ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(UnobservableNotice, null, d.unobservable)) : null) : d.reasoning ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxHeight: 42,
      overflow: 'hidden',
      padding: '0 18px 0 54px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 14,
      lineHeight: 1.6,
      color: 'var(--qc-ink-muted)',
      maxWidth: '68ch'
    }
  }, d.reasoning), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 'auto 0 0 0',
      height: 26,
      background: 'linear-gradient(to bottom, rgba(255,255,255,0), #FFFFFF)'
    }
  })) : null, open || !d.reasoning ? null : /*#__PURE__*/React.createElement("div", {
    style: {
      height: 14
    }
  }));
}
function ReportScreen({
  onBack
}) {
  const run = window.QC_RUN;
  const [open, setOpen] = React.useState('10');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1152,
      margin: '0 auto',
      padding: '28px 32px 96px'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    icon: "back",
    style: {
      padding: 0
    },
    onClick: onBack
  }, "Back"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) 168px',
      gap: 48,
      marginTop: 26
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 22,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(MicroLabel, null, "Full analysis"), /*#__PURE__*/React.createElement(MicroLabel, null, run.type), /*#__PURE__*/React.createElement(MicroLabel, {
    style: {
      color: 'var(--qc-ink-dim)'
    }
  }, run.id, " \xA0\xB7\xA0 ", run.runId)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 30,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--qc-display)',
      fontWeight: 600,
      fontSize: 52,
      lineHeight: .98,
      letterSpacing: '-.04em',
      margin: 0
    }
  }, run.coachee), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 13.5,
      color: 'var(--qc-ink-muted)',
      marginTop: 12
    }
  }, "Coached by ", run.coach)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    icon: "kick-off"
  }, "Watch recording"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "download"
  }, "Download PDF"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 10,
      color: 'var(--qc-ink-dim)'
    }
  }, "evaluated ", run.evaluated))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 34,
      alignItems: 'flex-start',
      marginTop: 40,
      paddingTop: 30,
      borderTop: '1px solid var(--qc-rule)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-display)',
      fontWeight: 700,
      fontSize: 80,
      lineHeight: .94,
      letterSpacing: '-.05em'
    }
  }, run.score), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 10,
      letterSpacing: '.16em',
      textTransform: 'uppercase',
      color: 'var(--qc-inconsistent)',
      marginTop: 6
    }
  }, "Inconsistent")), /*#__PURE__*/React.createElement(BandRail, {
    band: run.band,
    caption: run.caption,
    style: {
      flex: 1,
      maxWidth: 470,
      paddingTop: 16
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 34
    }
  }, /*#__PURE__*/React.createElement(MicroLabel, {
    style: {
      marginBottom: 12
    }
  }, "Caps"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, run.caps.map(c => /*#__PURE__*/React.createElement(CapNotice, {
    key: c.state,
    state: c.state
  }, c.body)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40,
      paddingTop: 30,
      borderTop: '1px solid var(--qc-rule)'
    }
  }, /*#__PURE__*/React.createElement(MicroLabel, {
    style: {
      marginBottom: 14
    }
  }, "The one thing"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-display)',
      fontWeight: 600,
      fontSize: 26,
      lineHeight: 1.3,
      letterSpacing: '-.025em',
      maxWidth: '26ch'
    }
  }, run.oneThing)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 30
    }
  }, /*#__PURE__*/React.createElement(MicroLabel, {
    style: {
      marginBottom: 12
    }
  }, "The brief"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 14,
      lineHeight: 1.7,
      color: 'var(--qc-ink-muted)',
      maxWidth: '68ch'
    }
  }, run.brief)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 34
    }
  }, /*#__PURE__*/React.createElement(MicroLabel, {
    style: {
      marginBottom: 12
    }
  }, "Red flags"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, run.redFlags.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.line,
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--qc-at-risk)',
      display: 'flex',
      paddingTop: 2
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "contradiction",
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 13.5,
      lineHeight: 1.55,
      color: 'var(--qc-brand)',
      maxWidth: '64ch'
    }
  }, f.text), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 11,
      color: 'var(--qc-ink-dim)'
    }
  }, f.line))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40,
      paddingTop: 30,
      borderTop: '1px solid var(--qc-rule)'
    }
  }, /*#__PURE__*/React.createElement(MicroLabel, {
    style: {
      marginBottom: 14
    }
  }, "Twelve dimensions"), run.dimensions.map(d => /*#__PURE__*/React.createElement(DimensionRow, {
    key: d.i,
    d: d,
    open: open === d.i,
    onToggle: () => setOpen(open === d.i ? null : d.i)
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 76,
      alignSelf: 'start'
    }
  }, /*#__PURE__*/React.createElement(MicroLabel, {
    style: {
      marginBottom: 12
    }
  }, "Jump to"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 7
    }
  }, run.dimensions.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.i,
    onClick: () => setOpen(d.i),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 4,
      height: 4,
      borderRadius: 999,
      background: open === d.i ? 'var(--qc-brand)' : 'var(--qc-rule-strong)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 9.5,
      color: open === d.i ? 'var(--qc-brand)' : 'var(--qc-ink-dim)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, d.i, " ", d.title)))))));
}
Object.assign(window, {
  ReportScreen,
  DimensionRow
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/qc-evaluator-app/ReportScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/qc-evaluator-app/RunFormScreen.jsx
try { (() => {
const {
  Button,
  Input,
  RubricCard,
  Icon
} = window.QCDS;

/* P2 — the textarea is the hero: a DOCUMENT surface (sunk, mono, line-numbered),
   not a form field. Deterministic stats compute in the margin as you paste,
   before a single token is spent. Two rubric cards, not a dropdown. */

const SAMPLE = ['L186  PRIYA RAMAN: Before you go — let\u2019s get the next one in.', 'L187  PRIYA RAMAN: I\u2019ve got Wednesday the 10th at four, or Friday morning.', 'L188  MALIK OSEI: Wednesday the 10th at four, yeah, I\u2019m off that day, that one works.', 'L189  MALIK OSEI: Let\u2019s lock that in.', 'L190  PRIYA RAMAN: Perfect. And you\u2019ll send me the two videos before then?', 'L191  MALIK OSEI: Yeah, Sunday night at the latest.', 'L192  PRIYA RAMAN: Good.', 'L193  PRIYA RAMAN: Alright, go get some rest, I\u2019ll get you those times soon', '      so we can get this locked on the calendar.'];
function RunFormScreen({
  onRun
}) {
  const [rubric, setRubric] = React.useState('coaching');
  const [pasted, setPasted] = React.useState(true);
  return /*#__PURE__*/React.createElement(Page, {
    width: 1152
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--qc-display)',
      fontWeight: 600,
      fontSize: 44,
      lineHeight: 1,
      letterSpacing: '-.04em',
      margin: 0
    }
  }, "Run an evaluation"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 14,
      color: 'var(--qc-ink-muted)',
      marginTop: 12
    }
  }, "Score one call at a time against its rubric."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16,
      marginTop: 36,
      maxWidth: 760
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Coach",
    icon: "search",
    value: "Priya Raman"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Client",
    icon: "search",
    value: "Malik Osei"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      maxWidth: 760
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Program (optional)",
    placeholder: "e.g. Q2 cohort"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 34,
      display: 'grid',
      gridTemplateColumns: '1fr 208px',
      gap: 24,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(MicroLabel, {
    style: {
      marginBottom: 8
    }
  }, "Transcript"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--qc-sunk)',
      border: '1px solid var(--qc-rule)',
      borderRadius: 6,
      padding: '16px 18px',
      minHeight: 218,
      cursor: 'text'
    },
    onClick: () => setPasted(true)
  }, pasted ? /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      fontFamily: 'var(--qc-mono)',
      fontSize: 11.5,
      lineHeight: 1.85,
      color: 'var(--qc-ink-muted)',
      whiteSpace: 'pre-wrap'
    }
  }, SAMPLE.join('\n')) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 11.5,
      color: 'var(--qc-ink-dim)'
    }
  }, "Paste the full transcript\u2026"))), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 26
    }
  }, /*#__PURE__*/React.createElement(MicroLabel, {
    style: {
      marginBottom: 12
    }
  }, "Measured on paste"), [['lines', '214'], ['characters', '18,402'], ['speakers', '2'], ['coach talk-share', '66.6%'], ['[inaudible] markers', '3'], ['timestamps', 'none']].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
      padding: '7px 0',
      borderBottom: '1px solid var(--qc-rule)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 12,
      color: 'var(--qc-ink-muted)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 11,
      color: 'var(--qc-brand)'
    }
  }, v))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 11.5,
      lineHeight: 1.55,
      color: 'var(--qc-ink-dim)',
      marginTop: 12
    }
  }, "Computed in the browser, before a single token is spent."))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40,
      maxWidth: 760
    }
  }, /*#__PURE__*/React.createElement(MicroLabel, {
    style: {
      marginBottom: 12
    }
  }, "Choose the call to evaluate"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 0
    }
  }, /*#__PURE__*/React.createElement(RubricCard, {
    icon: "kick-off",
    label: "Kick-off call",
    meta: "12 dims \xB7 105 pts",
    selected: rubric === 'kick-off',
    onClick: () => setRubric('kick-off'),
    style: {
      borderRight: 0
    }
  }), /*#__PURE__*/React.createElement(RubricCard, {
    icon: "coaching",
    label: "Coaching call",
    meta: "12 dims \xB7 105 pts",
    selected: rubric === 'coaching',
    onClick: () => setRubric('coaching')
  }), /*#__PURE__*/React.createElement(RubricCard, {
    icon: "talk-share",
    label: "Strategic review",
    meta: "out of scope",
    action: "\u2014",
    disabled: true,
    style: {
      borderLeft: 0
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 30,
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: onRun
  }, "Run evaluation"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    icon: "discard"
  }, "Clear")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 22,
      color: 'var(--qc-ink-dim)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-body)',
      fontSize: 11.5
    }
  }, "Runs from this page are flagged as mock ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--qc-mono)',
      fontSize: 11
    }
  }, "(is_evaluator_test=true)"), " and queued for cleanup before prod.")));
}
Object.assign(window, {
  RunFormScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/qc-evaluator-app/RunFormScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/qc-evaluator-app/data.js
try { (() => {
/* Sample run: coaching-01 — the transcript the whole system is built around.
   A meeting time is agreed at L188 and withdrawn at L193, so the booking cap
   cannot resolve to fired or not-fired. Numbers here are illustrative but
   internally consistent: raw 82 of 105 available → 78, band INCONSISTENT. */

window.QC_RUN = {
  id: 'coaching-01',
  runId: 'a91f3c',
  coachee: 'Malik Osei',
  coach: 'Priya Raman',
  type: 'Coaching call',
  evaluated: '2h ago',
  score: 78,
  raw: 82,
  available: 105,
  band: 'inconsistent',
  caption: 'raw 82 / 105  \u2192  78  \u00B7  2 points from STRONG',
  oneThing: 'Book the next call on the call.',
  brief: 'Priya diagnosed accurately and coached the movement work better than she coached the plan. ' + 'Malik left clear on what to change this week and why it matters. What the call did not do is ' + 'close the loop: the next session was discussed, agreed, and then handed back to email five ' + 'lines later. Everything downstream of that \u2014 accountability, adherence, momentum \u2014 rests on a ' + 'booking that this transcript cannot confirm happened.',
  redFlags: [{
    text: 'Next session agreed verbally, then deferred to email. No confirmed date on the call.',
    line: 'L193'
  }, {
    text: 'Diagnostics were reviewed but never tied back to the named 12-month outcome.',
    line: 'L74'
  }],
  caps: [{
    state: 'INDETERMINATE',
    body: 'Next call booked live \u2014 cannot be verified. L188 agrees a time; L193 withdraws it. Scored the unverified branch: D10 \u2192 0/5.'
  }, {
    state: 'NOT_FIRED',
    body: 'Coach talk-share 66.6% (63.1\u201370.4% at r=0.8\u20131.2) \u2014 below 75% on every reading.'
  }],
  dimensions: [{
    i: '01',
    title: 'Check-in & connection',
    score: '9/10',
    band: 'elite',
    reasoning: 'Opened on last week\u2019s sleep and load before touching the plan, and named a specific detail from the previous session rather than a generic check-in.'
  }, {
    i: '02',
    title: 'Diagnostics review',
    score: '8/10',
    band: 'strong',
    reasoning: 'Walked knee-over-toe, torso angle and spinal rounding against the SOP one by one. Covered more than the sheet requires, but did not connect the findings to Malik\u2019s stated 12-month outcome.'
  }, {
    i: '03',
    title: 'Long-term vision',
    score: '12/15',
    band: 'strong',
    reasoning: 'The outcome was restated and Malik articulated why it matters in his own words. The link from this week\u2019s work back to that outcome was implied rather than stated.'
  }, {
    i: '04',
    title: 'Movement coaching quality',
    score: '15/15',
    band: 'elite',
    reasoning: 'Reviewed recorded attempts, gave two actionable setup cues and one control cue, and had Malik repeat them back. Breathing cues were the only omission and are not required at this stage.'
  }, {
    i: '05',
    title: 'Adjustments & strategy',
    score: '10/10',
    band: 'elite',
    reasoning: 'Load and frequency changes were specific, justified against the diagnostics, and bounded \u2014 two weeks, then reassess.'
  }, {
    i: '06',
    title: 'Action steps & accountability',
    score: '10/10',
    band: 'elite',
    reasoning: 'Three steps, each with an owner and a day. Malik confirmed all three.'
  }, {
    i: '07',
    title: 'Objection & concern handling',
    score: '8/10',
    band: 'strong',
    reasoning: 'The travel-week concern was heard and worked around. A second, quieter concern about shoulder discomfort was acknowledged but not resolved before the call closed.'
  }, {
    i: '08',
    title: 'Talk-share balance',
    score: '5/5',
    band: 'elite',
    mono: 'coach 66.6% \u00B7 client 33.4%',
    reasoning: 'Measured from word counts, not time \u2014 the transcript has no timestamps. 66.6% sits inside the target range on every speech-rate assumption tested.'
  }, {
    i: '09',
    title: 'Program adherence review',
    score: '5/5',
    band: 'elite',
    reasoning: 'Both missed sessions were surfaced by the coach, not volunteered, and the cause was traced before the fix was proposed.'
  }, {
    i: '10',
    title: 'Next call booking',
    score: '0/5',
    band: 'fail',
    reasoning: 'Scored 0/5 because the transcript contains two statements about the next call that cannot both be true. Rather than pick the flattering one, the score takes the unverified branch and the cap above reports the fact as indeterminate.',
    evidence: [{
      line: 'L188',
      speaker: 'Malik Osei',
      quote: 'Wednesday the 10th at four, yeah, I\u2019m off that day, that one works. Let\u2019s lock that in.'
    }, {
      line: 'L193',
      speaker: 'Priya Raman',
      contradicts: 'L188',
      quote: 'Alright, go get some rest, I\u2019ll get you those times soon so we can get this locked on the calendar.'
    }, {
      line: 'L204',
      speaker: 'Malik Osei',
      degraded: true,
      quote: 'Yeah I\u2019ll get the [inaudible] over to you before then.'
    }],
    quickFix: 'Say the date and time out loud, then ask for a verbal confirmation before moving on: \u201CWednesday the 10th at four \u2014 confirmed?\u201D One sentence closes this dimension.'
  }, {
    i: '11',
    title: 'Recap & confirmation',
    score: 'not evidenced',
    band: 'not-evidenced',
    reasoning: 'No closing summary appears anywhere in the transcript. This is absent from the source, not scored as zero \u2014 the distinction matters when the report is read next to the call.'
  }, {
    i: '12',
    title: 'Tone & rapport',
    score: 'N/A',
    band: 'na',
    unobservable: 'D12 Elite requires \u201Clistens before responding \u2014 no interruption.\u201D The transcript has no overlap markers, no timestamps and strictly alternating turns. This criterion was excluded from the score rather than guessed.'
  }],
  manifest: ['Check-in & connection', 'Diagnostics review', 'Long-term vision', 'Movement coaching quality', 'Adjustments & strategy', 'Action steps & accountability', 'Objection & concern handling', 'Talk-share balance', 'Program adherence review', 'Next call booking', 'Recap & confirmation', 'Tone & rapport']
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/qc-evaluator-app/data.js", error: String((e && e.message) || e) }); }

__ds_ns.KickOffIcon = __ds_scope.KickOffIcon;

__ds_ns.CoachingIcon = __ds_scope.CoachingIcon;

__ds_ns.ContradictionIcon = __ds_scope.ContradictionIcon;

__ds_ns.EvidenceIcon = __ds_scope.EvidenceIcon;

__ds_ns.TranscriptIcon = __ds_scope.TranscriptIcon;

__ds_ns.TalkShareIcon = __ds_scope.TalkShareIcon;

__ds_ns.CapIcon = __ds_scope.CapIcon;

__ds_ns.VerifiedIcon = __ds_scope.VerifiedIcon;

__ds_ns.FailedIcon = __ds_scope.FailedIcon;

__ds_ns.CapFiredIcon = __ds_scope.CapFiredIcon;

__ds_ns.IndeterminateIcon = __ds_scope.IndeterminateIcon;

__ds_ns.NotApplicableIcon = __ds_scope.NotApplicableIcon;

__ds_ns.NotEvidencedIcon = __ds_scope.NotEvidencedIcon;

__ds_ns.QueuedIcon = __ds_scope.QueuedIcon;

__ds_ns.ScoringIcon = __ds_scope.ScoringIcon;

__ds_ns.DegradedIcon = __ds_scope.DegradedIcon;

__ds_ns.UnobservableIcon = __ds_scope.UnobservableIcon;

__ds_ns.CompleteIcon = __ds_scope.CompleteIcon;

__ds_ns.WorkerDiedIcon = __ds_scope.WorkerDiedIcon;

__ds_ns.DownloadIcon = __ds_scope.DownloadIcon;

__ds_ns.RetryIcon = __ds_scope.RetryIcon;

__ds_ns.CopyIcon = __ds_scope.CopyIcon;

__ds_ns.ChevronIcon = __ds_scope.ChevronIcon;

__ds_ns.BackIcon = __ds_scope.BackIcon;

__ds_ns.ExternalIcon = __ds_scope.ExternalIcon;

__ds_ns.SearchIcon = __ds_scope.SearchIcon;

__ds_ns.MenuIcon = __ds_scope.MenuIcon;

__ds_ns.CaretIcon = __ds_scope.CaretIcon;

__ds_ns.AddIcon = __ds_scope.AddIcon;

__ds_ns.InfoIcon = __ds_scope.InfoIcon;

__ds_ns.DiscardIcon = __ds_scope.DiscardIcon;

__ds_ns.QcMark = __ds_scope.QcMark;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.CapNotice = __ds_scope.CapNotice;

__ds_ns.EvidenceCitation = __ds_scope.EvidenceCitation;

__ds_ns.UnobservableNotice = __ds_scope.UnobservableNotice;

__ds_ns.QC_ICONS = __ds_scope.QC_ICONS;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.ProgressRow = __ds_scope.ProgressRow;

__ds_ns.RubricCard = __ds_scope.RubricCard;

__ds_ns.BandRail = __ds_scope.BandRail;

__ds_ns.ScoreChip = __ds_scope.ScoreChip;

})();
