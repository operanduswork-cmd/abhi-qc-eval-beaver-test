/**
 * One mark per dimension — and the two rubrics do NOT share a set.
 *
 * They used to: the keys were "D1".."D12" and both packs read the same twelve marks, so
 * coaching D1 "Check-In & Connection" and kickoff D1 "Pre-Call Preparation" wore the same two
 * speech bubbles, and so did the other eleven pairs. The id is only positional; it carries no
 * meaning across packs. Keys are therefore `${callType}:${id}`.
 *
 * House style: concrete objects only — a thing you could point at in a room. No abstract
 * "insight"/"synergy" glyphs, no sparkles, no brains, no lightbulbs.
 *
 * FOOTGUN: SVG's default stroke is `none`. Every path below relies on the wrapper setting
 * stroke:currentColor AND fill:none. Set both, or the marks render invisible.
 */
export interface Icon {
  name: string;
  paths: string[];
}

export const DIMENSION_ICONS: Record<string, Icon> = {
  // ------------------------------------------------------------------ coaching
  "coaching:D1":  { name: "two speech bubbles", paths: [
    "M3 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7l-4 3z",
    "M17 9h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1v3l-3-3" ] },
  "coaching:D2":  { name: "split screen with play head", paths: [
    "M3 5h18v14H3z", "M12 5v14", "M7 10l3 2-3 2z", "M15 10h3M15 13h3M15 16h2" ] },
  "coaching:D3":  { name: "sun over a horizon", paths: [
    "M3 19h18", "M6.5 19a5.5 5.5 0 0 1 11 0",
    "M12 4v2M5.6 7.6l1.4 1.4M18.4 7.6L17 9M2 13h2M20 13h2" ] },
  "coaching:D4":  { name: "figure mid-stride", paths: [
    "M14 6.3a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z",
    "M9.5 21l2.5-5-2-3 3-3.5 3 2.5 2.5.5", "M10 10.5L6.5 12", "M14.5 16l1.5 5" ] },
  "coaching:D5":  { name: "two sliders", paths: [
    "M4 8h9M17 8h3", "M17 8a2 2 0 1 0-4 0 2 2 0 0 0 4 0z",
    "M4 16h3M11 16h9", "M11 16a2 2 0 1 0-4 0 2 2 0 0 0 4 0z" ] },
  "coaching:D6":  { name: "clipboard with a tick", paths: [
    "M9 4H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2",
    "M9 2.5h6v3.5H9z", "M8.5 13l2.5 2.5 4.5-5" ] },
  "coaching:D7":  { name: "anchor", paths: [
    "M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M12 7v14", "M8 10h8", "M5 14a7 7 0 0 0 14 0" ] },
  "coaching:D8":  { name: "life ring", paths: [
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", "M15.6 12a3.6 3.6 0 1 1-7.2 0 3.6 3.6 0 0 1 7.2 0z",
    "M12 3v5.4M12 15.6V21M3 12h5.4M15.6 12H21" ] },
  "coaching:D9":  { name: "flag", paths: [ "M6 21V4", "M6 5h11l-2.2 3.5L17 12H6" ] },
  "coaching:D10": { name: "calendar", paths: [
    "M3 5h18v16H3z", "M3 10h18M8 3v4M16 3v4", "M13.6 15a1.6 1.6 0 1 1-3.2 0 1.6 1.6 0 0 1 3.2 0z" ] },
  "coaching:D11": { name: "chain links", paths: [
    "M10 13a4 4 0 0 0 5.7.4l2.6-2.6a4 4 0 0 0-5.7-5.7l-1.5 1.5",
    "M14 11a4 4 0 0 0-5.7-.4l-2.6 2.6a4 4 0 0 0 5.7 5.7l1.5-1.5" ] },
  "coaching:D12": { name: "hourglass", paths: [
    "M7 3h10M7 21h10", "M8 3v3.5c0 2 4 3.7 4 5.5s-4 3.5-4 5.5V21",
    "M16 3v3.5c0 2-4 3.7-4 5.5s4 3.5 4 5.5V21" ] },

  // ------------------------------------------------------------------- kickoff
  "kickoff:D1":  { name: "file folder with a sheet", paths: [
    "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    "M8 12h8M8 15h5" ] },
  "kickoff:D2":  { name: "tuning fork", paths: [
    "M9 3v7a3 3 0 0 0 6 0V3", "M12 13v8", "M10 18.5h4" ] },
  "kickoff:D3":  { name: "pinned agenda sheet", paths: [
    "M12 2.5v3.5", "M9.5 6h5v2h-5z", "M5 9h14v12H5z", "M8 13h8M8 16h8M8 19h5" ] },
  "kickoff:D4":  { name: "target with an arrow", paths: [
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
    "M12 12l7-7", "M15 5h4v4" ] },
  "kickoff:D5":  { name: "three rising steps", paths: [
    "M3 20h5v-4H3z", "M9.5 20h5v-8h-5z", "M16 20h5v-12h-5z" ] },
  "kickoff:D6":  { name: "road to the horizon", paths: [
    "M9 21L11 4", "M15 21L13 4", "M12 7.5v2M12 12.5v2M12 17.5v2" ] },
  "kickoff:D7":  { name: "support headset", paths: [
    "M4 14v-2a8 8 0 0 1 16 0v2",
    "M4 13h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z",
    "M20 13h-2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1z",
    "M17 19v.5a2.5 2.5 0 0 1-2.5 2.5H12" ] },
  "kickoff:D8":  { name: "magnifier over lines", paths: [
    "M14.5 10.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z", "M14.5 14.5L21 21",
    "M6.5 9h5M6.5 12h3" ] },
  "kickoff:D9":  { name: "ruler", paths: [
    "M2 8h20v8H2z", "M6 8v4M10 8v3M14 8v4M18 8v3" ] },
  "kickoff:D10": { name: "handset and a clock", paths: [
    "M3 5.5A2.5 2.5 0 0 1 5.5 3h1.6a1 1 0 0 1 1 .8l.6 2.6a1 1 0 0 1-.5 1.1l-1.3.7a12 12 0 0 0 5.4 5.4l.7-1.3a1 1 0 0 1 1.1-.5l2.6.6a1 1 0 0 1 .8 1v1.6a2.5 2.5 0 0 1-2.5 2.5A13.5 13.5 0 0 1 3 5.5z",
    "M21.5 6a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z", "M18 4.4V6l1.2.8" ] },
  "kickoff:D11": { name: "closed book with a bookmark", paths: [
    "M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17H7.5A2.5 2.5 0 0 0 5 21.5z", "M13 2v7l2-1.6L17 9V2" ] },
  "kickoff:D12": { name: "paper plane", paths: [
    "M21 3L3 10.5l7 3z", "M21 3l-3 18-8-7.5z", "M10 13.5L21 3" ] },

  // ------------------------------------------------------------ interface marks
  // Not a dimension. Lives here so every mark in the product is in one file, which is the
  // property test/presentation.test.ts guards.
  "ui:clock": { name: "clock face", paths: [
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", "M12 7v5.2l3.4 2" ] },

  // --------------------------------------------------- the two call-type marks
  "call:kickoff":  { name: "door", paths: [
    "M6 3h12v18H6z", "M3 21h18", "M15.4 12.5a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0z" ] },
  "call:coaching": { name: "whistle", paths: [
    "M8.5 7h7a4.5 4.5 0 0 1 0 9h-7A4.5 4.5 0 0 1 8.5 7z",
    "M8.5 9.5H3.5a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h5",
    "M14.5 11.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" ] },
};

/** Look up a dimension's mark. `callType` is required — the id alone is ambiguous across packs. */
export function iconFor(callType: string, id: string): Icon | undefined {
  return DIMENSION_ICONS[`${callType}:${id}`];
}

/**
 * Inline SVG for one mark. Both `stroke` and `fill` are set here on purpose; see the footgun
 * note above. Returns "" for an unknown key rather than an empty <svg>, so a missing mark
 * collapses instead of leaving a 14px hole.
 */
export function iconSvg(key: string, size = 14, colour = "var(--qc-ink-dim)"): string {
  const g = DIMENSION_ICONS[key];
  if (!g) return "";
  return (
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" style="flex:none;` +
    `fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;` +
    `color:${colour}">` +
    g.paths.map((d) => `<path d="${d}"/>`).join("") +
    `</svg>`
  );
}
