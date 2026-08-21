import { renderLanding } from "../lib/report/serve.ts";

/**
 * GET / — the landing page (screen 3b): this browser's runs, or the empty state.
 *
 * The form lives at /new. Serving the form here was the original mistake — it turned a
 * four-screen app into a single page and skipped the entry point entirely.
 *
 * No database query. The first version listed the twelve most recent runs to whoever loaded the
 * page, which handed every visitor a directory of everyone else's calls — the run id is the
 * capability that makes a report shareable without a login, so printing the ids gives that
 * capability away. The browser keeps its own ids and asks about those.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(renderLanding(), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
