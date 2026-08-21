/**
 * CLI over lib/report/render.ts — rebuilds the design preview in app/index.html.
 *
 *   npm run render                    # coaching-01
 *   npm run render -- eval/out/other.json
 *
 * The live app calls the same renderReport() per request; this only writes the static preview.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { renderReport } from "../lib/report/render.ts";
import { DIMENSION_ICONS } from "../lib/report/icons.ts";

const SCORED = process.argv[2] ?? "eval/out/coaching-01.json";
const COPY = process.argv[3] ?? "fixtures/report-copy/coaching-01.json";
const PAGE = "app/index.html";

const run = JSON.parse(readFileSync(SCORED, "utf8"));
let copy: any = {};
try { copy = JSON.parse(readFileSync(COPY, "utf8")); } catch { copy = {}; }

const out = renderReport(run, copy, readFileSync(PAGE, "utf8"));
writeFileSync(PAGE, out, "utf8");

const t = run.total;
const ev = run.dimensions.reduce((n: number, d: any) => n + d.evidence.length, 0);
console.log(`rendered ${run.dimensions.length} dimensions from ${SCORED}`);
console.log(`  ${t.rawTotal}/${t.maxPossible} raw -> ${t.normalizedTotal}/100 ${t.band.name}`);
console.log(`  evidence rows: ${ev}`);
console.log(`  icons: ${run.dimensions.filter((d: any) => DIMENSION_ICONS[`${run.callType}:${d.id}`]).length}/12`);
