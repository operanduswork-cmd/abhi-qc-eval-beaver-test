import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db/queries.ts";

/**
 * GET /api/runs/:id/context?line=188&radius=3 — the transcript around one cited line.
 *
 * WHY A WINDOW AND NOT THE WHOLE TRANSCRIPT. The run URL is shareable without a login, which is
 * the brief's first constraint. Today a shared report discloses the QUOTES the scorer cited.
 * Embedding the full transcript in the page so the browser could slice it locally would be
 * simpler and faster — and it would silently upgrade every shared link from "the evidence" to
 * "the entire call". That is a change to what sharing means, so it is not made by accident for
 * the sake of one fetch.
 *
 * This returns only the immediate neighbourhood of a line the report already quotes.
 *
 * Line numbers index `runs.transcript_body`, the CANONICAL body — the same text the scorer
 * hashed and numbered — so `body.split("\n")[line - 1]` is exactly the line the evidence names.
 * Slicing the raw upload instead would drift by any BOM, CRLF or trailing whitespace the
 * canonicaliser removed.
 */
export const dynamic = "force-dynamic";

const MAX_RADIUS = 6;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Not a valid run id." }, { status: 400 });
  }

  const url = new URL(req.url);
  const line = Number(url.searchParams.get("line"));
  if (!Number.isInteger(line) || line < 1) {
    return NextResponse.json({ error: "line must be a positive integer." }, { status: 400 });
  }
  // Clamped rather than honoured: an unbounded radius is how a "context window" quietly becomes
  // the whole transcript through a query string.
  const radius = Math.min(MAX_RADIUS, Math.max(1, Number(url.searchParams.get("radius")) || 3));

  const r = await db().from("runs").select("transcript_body").eq("id", id).maybeSingle();
  if (r.error || !r.data) {
    return NextResponse.json({ error: "No run with that id." }, { status: 404 });
  }

  const lines = String((r.data as { transcript_body: string }).transcript_body).split("\n");
  if (line > lines.length) {
    return NextResponse.json(
      { error: `That transcript has ${lines.length} lines.` },
      { status: 404 },
    );
  }

  const from = Math.max(1, line - radius);
  const to = Math.min(lines.length, line + radius);

  return NextResponse.json(
    {
      line,
      from,
      to,
      total: lines.length,
      lines: lines.slice(from - 1, to).map((text, i) => ({
        n: from + i,
        text,
        cited: from + i === line,
      })),
    },
    { status: 200, headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
  );
}
