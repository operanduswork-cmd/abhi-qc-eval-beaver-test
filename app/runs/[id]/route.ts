import { contractFor, progressFor } from "../../../lib/run.ts";
import { renderFinished, renderPending, renderNotice } from "../../../lib/report/serve.ts";

/**
 * GET /runs/:id — the shareable URL.
 *
 * Resolves for anyone, with no login, and still resolves next week: the run id is the whole
 * capability, the report is stored whole, and a finished run is immutable.
 */
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const html = (body: string, status = 200, immutable = false) =>
    new Response(body, {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-store",
      },
    });

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return html(renderNotice(
      "Not a run",
      "That is not a run link",
      'Run links look like <code>/runs/0f9c…-…</code>. Check the link, or ' +
      '<a href="/">start a new run</a>.',
    ), 400);
  }

  const contract = await contractFor(id);
  if (!contract) {
    return html(renderNotice(
      "Run not found",
      "No run with that id",
      'The link may be mistyped, or the run may never have existed. ' +
      '<a href="/">Start a new run</a>.',
    ), 404);
  }

  if (contract.status === "finished") return html(renderFinished(contract), 200, true);

  // progressFor re-reads the run, so it can only be null if the row vanished between the two
  // reads. Fall back to an empty rubric rather than inventing twelve rows we cannot name.
  const p = (await progressFor(id)) ?? { done: 0, total: 12, dimensions: [] };
  return html(renderPending(contract, p));
}
