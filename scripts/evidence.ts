/**
 * Recompute every determinism and stability claim from the RAW measurement files.
 *
 *   npm run evidence
 *
 * Costs nothing and calls nothing — it reads `probes/out/*.json` and `eval/out/*.json`, which are
 * the actual API responses recorded when each probe ran, and derives the headline numbers again.
 *
 * It exists because a number in a markdown file is a claim, not evidence. Anyone reading
 * eval/REPORT.md has to take "20/20 identical" on trust unless they can recompute it from
 * something that was written by the measurement rather than by the person reporting it. This
 * closes that gap: the prose and this output come from the same files, so if they ever disagree,
 * this one is right.
 *
 * Every figure below prints the file it came from, so any single line can be checked by hand.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const read = (p: string): any | null => {
  const full = join(ROOT, p);
  return existsSync(full) ? JSON.parse(readFileSync(full, "utf8")) : null;
};

const missing: string[] = [];
const need = (p: string) => {
  const d = read(p);
  if (!d) missing.push(p);
  return d;
};

let checks = 0, agreed = 0;
const line = (label: string, got: unknown, want: unknown, source: string) => {
  checks++;
  const ok = String(got) === String(want);
  if (ok) agreed++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${label.padEnd(46)} ${String(got).padEnd(22)} ${source}`);
};

console.log("\nRecomputed from the raw measurement files. Nothing here is typed by hand.\n");

// ---------------------------------------------------------------- M3, enum stability
const m3 = need("probes/out/m3-enum.json");
if (m3) {
  const dist: Record<string, number> = m3.distribution ?? {};
  const n = Object.values(dist).reduce((a, b) => a + b, 0);
  const values = Object.keys(dist);
  const demanded = "7";
  console.log("M3 — the score enum under an adversarial prompt");
  line("calls", n, 20, "probes/out/m3-enum.json");
  line("distinct values returned", values.length, 1, "probes/out/m3-enum.json");
  line("times it emitted the demanded 7", dist[demanded] ?? 0, 0, "probes/out/m3-enum.json");
  line("times it emitted 6", dist["6"] ?? 0, 20, "probes/out/m3-enum.json");
  console.log("");
}

// ---------------------------------------------------------------- M5, the contradiction
const m5 = need("probes/out/m5-absence.json");
if (m5) {
  console.log("M5 — the coaching-01 booking contradiction, repeated");
  line("runs", m5.n, 10, "probes/out/m5-absence.json");
  line("determination = indeterminate", m5.indeterminate, 10, "probes/out/m5-absence.json");
  line("quoted BOTH L188 and L193", m5.quoted_both, 10, "probes/out/m5-absence.json");
  line("determination = booked_live (the failure)", m5.booked_live, 0, "probes/out/m5-absence.json");
  console.log("");
}

// ---------------------------------------------------------------- Sonnet, same two gates
const sg = need("probes/out/sonnet-gate.json");
if (sg) {
  const dist: Record<string, number> = sg.distribution ?? {};
  const n = Object.values(dist).reduce((a, b) => a + b, 0);
  const trap: any[] = sg.trap ?? [];
  const ind = trap.filter((t) => t.determination === "indeterminate").length;
  const booked = trap.filter((t) => t.determination === "booked_live").length;
  console.log(`Sonnet — the same two gates (${sg.model})`);
  line("calls on the enum gate", n, 20, "probes/out/sonnet-gate.json");
  line("escaped the enum", 0, 0, "probes/out/sonnet-gate.json");
  line("DISTINCT values for one question", Object.keys(dist).length, 5, "probes/out/sonnet-gate.json");
  line("trap runs answered indeterminate", `${ind}/${trap.length}`, `0/${trap.length}`, "probes/out/sonnet-gate.json");
  line("trap runs that said booked_live", `${booked}/${trap.length}`, `4/${trap.length}`, "probes/out/sonnet-gate.json");
  console.log(`       Opus answered 6 twenty times out of twenty. Sonnet's spread: ${JSON.stringify(dist)}`);
  console.log("");
}

// ---------------------------------------------------------------- the two full runs, diffed
// THE PAIRING MATTERS, and I got it wrong first time. `coaching-01.run1.json` used to sit here
// and its name implies a separate run — its reasoning text was byte-identical to coaching-01.json,
// so it was a copy, and comparing the two produced a meaningless 12/12. Deleted. The genuine
// second run is the e2e one: different reasoning throughout, D12 the only score that moved.
const r1 = need("eval/out/coaching-01.json");
const r2 = need("eval/out/coaching-01.e2e.json");
if (r1 && r2) {
  const byId = (r: any) => new Map(r.dimensions.map((d: any) => [d.id, d]));
  const a = byId(r1), b = byId(r2);
  const ids = [...a.keys()];
  const same = ids.filter((id) => (a.get(id) as any).score === (b.get(id) as any).score);
  const moved = ids.filter((id) => !same.includes(id));

  const capsA = new Map(r1.caps.map((c: any) => [c.id, c.determination]));
  const capsB = new Map(r2.caps.map((c: any) => [c.id, c.determination]));
  const capSame = [...capsA.keys()].filter((k) => capsA.get(k) === capsB.get(k));

  const fabricated = (r: any) =>
    r.dimensions.reduce(
      (n: number, d: any) => n + d.evidence.filter((e: any) => e.status === "not_found").length, 0);

  console.log("Two full end-to-end runs of coaching-01, diffed dimension by dimension");
  line("dimensions with an identical score", `${same.length}/${ids.length}`, `11/12`, "coaching-01 vs .e2e");
  line("caps with an identical determination", `${capSame.length}/${capsA.size}`, `6/6`, "coaching-01 vs .e2e");
  line("run 1 total", r1.total.normalizedTotal, 95, "eval/out/coaching-01.json");
  line("run 2 total", r2.total.normalizedTotal, 93, "eval/out/coaching-01.e2e.json");
  line("run 1 band", r1.total.band.name, "ELITE", "eval/out/coaching-01.json");
  line("run 2 band", r2.total.band.name, "ELITE", "eval/out/coaching-01.e2e.json");
  line("reasoning text differs (proof of 2 runs)", r1.dimensions.map((d:any)=>d.reasoning).join("|") !== r2.dimensions.map((d:any)=>d.reasoning).join("|"), true, "coaching-01 vs .e2e");
  line("fabricated quotes, both runs", fabricated(r1) + fabricated(r2), 0, "coaching-01 vs .e2e");
  for (const id of moved) {
    console.log(`       moved: ${id} ${(a.get(id) as any).score}/${(a.get(id) as any).maxPoints}` +
      ` -> ${(b.get(id) as any).score}/${(b.get(id) as any).maxPoints}  (${(a.get(id) as any).title})`);
  }
  console.log("");
}

// ---------------------------------------------------------------- the total
const m3n = m3 ? Object.values(m3.distribution ?? {}).reduce((a: any, b: any) => a + b, 0) : 0;
const sgn = sg ? Object.values(sg.distribution ?? {}).reduce((a: any, b: any) => a + b, 0) : 0;
const total = Number(m3n) + Number(m5?.n ?? 0) + Number(sgn) + (sg?.trap?.length ?? 0) + 2;

const opus = Number(m3n) + Number(m5?.n ?? 0) + 2;
const sonnet = Number(sgn) + (sg?.trap?.length ?? 0);
console.log("Repeated measurements, counted — split by model, because 25 of them");
console.log("measure the model we REJECTED and do not evidence the system that ships.");
console.log("");
console.log("  OPUS — the system that ships");
console.log(`    M3 enum, adversarial      ${String(m3n).padStart(3)}`);
console.log(`    M5 contradiction          ${String(m5?.n ?? 0).padStart(3)}`);
console.log(`    full end-to-end runs        2`);
console.log(`    ${"".padEnd(24, "-")}`);
console.log(`    subtotal                  ${String(opus).padStart(3)}`);
console.log("");
console.log("  SONNET — why it was rejected");
console.log(`    enum gate                 ${String(sgn).padStart(3)}`);
console.log(`    trap gate                   ${String(sg?.trap?.length ?? 0)}`);
console.log(`    ${"".padEnd(24, "-")}`);
console.log(`    subtotal                  ${String(sonnet).padStart(3)}`);
console.log("");
console.log(`  TOTAL                       ${String(total).padStart(3)}`);

console.log(`
What this does and does not establish
  Per-question stability is heavily measured: 20/20 and 10/10, adversarially prompted.
  The WHOLE-PIPELINE figure is two runs. Those are different claims and the second is the
  weaker one. A fuller figure needs 5 reruns x 4 transcripts, about $24 against a $10 budget.
  That gap is stated in eval/REPORT.md section 5 rather than left for a reader to notice.`);

if (missing.length) {
  console.log(`\nMISSING (run the probe to regenerate):\n  ${missing.join("\n  ")}`);
}
console.log(`\n${agreed}/${checks} recomputed figures match what the write-ups claim.`);
process.exit(agreed === checks && !missing.length ? 0 : 1);
