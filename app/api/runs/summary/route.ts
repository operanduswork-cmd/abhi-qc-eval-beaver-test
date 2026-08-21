import { NextResponse } from "next/server";
import { summariesFor } from "../../../../lib/db/queries.ts";

/**
 * POST /api/runs/summary — band and score for a list of run ids the caller already holds.
 *
 * It is a POST because it takes a list, not because it changes anything. There is no GET that
 * lists runs, on purpose: the run id IS the capability that makes a report shareable without a
 * login, so an endpoint that hands ids out would give that capability to everyone who loads the
 * landing page. The browser keeps its own ids in localStorage and asks about those.
 *
 * A "summary" segment can never collide with the sibling [id] route — Next matches static
 * segments first, and no run id is the literal string "summary".
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((v): v is string => typeof v === "string") : [];
  if (!ids.length) return NextResponse.json({ runs: [] }, { status: 200 });

  // A landing page that 500s because the database hiccuped is worse than one showing an empty
  // list, so a failed query degrades to no rows rather than an error.
  let runs: Awaited<ReturnType<typeof summariesFor>> = [];
  try { runs = await summariesFor(ids); } catch { runs = []; }

  return NextResponse.json({ runs }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
