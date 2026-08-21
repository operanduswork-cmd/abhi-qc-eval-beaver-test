import { after, type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { start, execute } from "../../../lib/run.ts";

/**
 * POST /api/runs — paste a transcript, get a URL.
 *
 * Returns `{ id }` as soon as the row is written and NEVER awaits the model. The whole scoring
 * pass happens in `after()`, which Next runs once the response has already been flushed, so the
 * operator can close the tab the instant they have their link.
 *
 * Fluid compute gives 300s, which comfortably covers the measured ~240s for thirteen calls. If
 * that ever stopped being enough, the per-dimension commits in the worker mean splitting into
 * two invocations of six is a config change rather than a rewrite.
 */
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { callType?: string; transcript?: string; coachName?: string; clientName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const callType = body.callType;
  if (callType !== "kickoff" && callType !== "coaching") {
    return NextResponse.json(
      { error: 'callType must be "kickoff" or "coaching". Only those two rubrics are in scope.' },
      { status: 400 },
    );
  }
  if (!body.transcript || typeof body.transcript !== "string" || body.transcript.trim() === "") {
    return NextResponse.json({ error: "No transcript was supplied." }, { status: 400 });
  }

  const started = await start({
    callType,
    transcript: body.transcript,
    ...(body.coachName ? { coachName: body.coachName } : {}),
    ...(body.clientName ? { clientName: body.clientName } : {}),
  });

  // A refusal is a 200-level product outcome, not a crash: the operator gets a sentence saying
  // exactly why (unreadable transcript, or not enough credit to finish), never a spinner.
  if (!started.ok || !started.runId) {
    return NextResponse.json({ error: started.message }, { status: 422 });
  }

  // Idempotent: the same transcript resolves to the same run and is NOT scored twice. The one
  // exception is a run that FAILED — `start` resets it and we score it again, so a dead run can
  // be retried on the URL that was already shared rather than stranding it.
  if (started.created || started.retried) {
    after(async () => {
      await execute(started.runId!, callType, body.transcript!);
    });
  }

  return NextResponse.json(
    { id: started.runId, reused: !started.created && !started.retried, retried: started.retried },
    { status: 202 },
  );
}
