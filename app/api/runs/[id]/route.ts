import { NextResponse } from "next/server";
import { contractFor, progressFor } from "../../../../lib/run.ts";

/**
 * GET /api/runs/:id — the shareable URL, and the four honest states.
 *
 * `queued` / `running` report progress; `finished` returns the stored contract verbatim;
 * `failed` returns why, in a sentence. There is deliberately no fifth state where the page
 * spins with nothing to say.
 *
 * The stale-worker sweep happens inside `loadRun`, on read. Vercel Cron on Hobby runs at most
 * once per DAY, so a scheduled sweeper is not available on the free tier — and sweeping on read
 * is exactly as timely as it needs to be, since nobody learns a run is dead until they look.
 */
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Not a valid run id." }, { status: 400 });
  }

  const contract = await contractFor(id);
  if (!contract) {
    return NextResponse.json(
      { error: "No run with that id. The link may be mistyped." },
      { status: 404 },
    );
  }

  if (contract.status === "running") {
    const p = await progressFor(id);
    return NextResponse.json(
      { ...contract, progress: p ?? { done: 0, total: 12 } },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(contract, {
    status: 200,
    // A finished run is immutable — same input, same run id, same report, forever.
    headers: { "Cache-Control": contract.status === "finished" ? "public, max-age=31536000, immutable" : "no-store" },
  });
}
