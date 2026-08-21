import { renderRunForm } from "../../lib/report/serve.ts";

/** GET /new — the run form (screen 2b). Reached from the landing page. */
export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(renderRunForm(), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
