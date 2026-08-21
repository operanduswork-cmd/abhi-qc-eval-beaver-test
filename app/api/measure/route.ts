import { NextResponse } from "next/server";
import { measure } from "../../../lib/transcript/measure.ts";

/**
 * POST /api/measure — what the form's "MEASURED ON PASTE" panel shows.
 *
 * It runs `lib/transcript/*`: the same canonicaliser, the same parser and the same talk-share
 * arithmetic the scorer runs. Counting the lines again in JavaScript would have been fewer
 * moving parts and would have been wrong within a week — the canonicaliser strips a BOM,
 * normalises newlines and NFC, rstrips every line and drops trailing blanks, so a browser-side
 * `text.split("\n").length` disagrees with the number the run is actually scored on.
 *
 * No database, no model, no cost. Safe to call on every keystroke (the form debounces anyway).
 */
export const dynamic = "force-dynamic";

/** Roughly 2x the largest fixture (coaching-02 is 65 KB). Refuses rather than parsing 10 MB. */
const MAX_BYTES = 400_000;

export async function POST(req: Request) {
  let body: { transcript?: unknown; callType?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const text = typeof body.transcript === "string" ? body.transcript : "";
  if (text.length > MAX_BYTES) {
    return NextResponse.json(
      { error: `That transcript is ${Math.round(text.length / 1000)} KB. The limit is ${MAX_BYTES / 1000} KB.` },
      { status: 413 },
    );
  }

  const callType = body.callType === "kickoff" ? "kickoff" : "coaching";
  return NextResponse.json(measure(text, callType), {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
