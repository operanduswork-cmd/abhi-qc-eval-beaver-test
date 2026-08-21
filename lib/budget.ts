/**
 * Pre-flight credit check.
 *
 * The brief requires that a failed run says why rather than spinning forever. Running out of
 * credit mid-run is one of the realistic ways this fails in front of someone else, and it is
 * the worst-looking one: twelve dimension calls, six succeed, the rest 402, and the page shows
 * a half-scored report or a spinner. The operator has no idea why.
 *
 * So the balance is checked BEFORE anything is charged, and a run that cannot afford to finish
 * is refused up front with a message that says exactly what happened and what to do.
 *
 * The estimate is deliberately conservative — measured cost per run ranged $0.64 (coaching-01)
 * to $1.48 (kickoff-02, seven enum groups), and a run that retries costs more. Refusing a run
 * we could probably have afforded is a much better failure than starting one we could not.
 */

export interface BudgetCheck {
  ok: boolean;
  remaining: number | null;
  estimatedCost: number;
  /** Shown to the operator verbatim when `ok` is false. */
  message: string | null;
}

/** Measured, not guessed. See probes/RESULTS.md. */
const COST_PER_1K_TOKENS_OF_TRANSCRIPT = 0.05;
const FLOOR = 0.35;
const SAFETY = 1.6; // covers a retry or two without refusing everything

export function estimateRunCost(transcriptChars: number, enumGroups: number): number {
  const kTokens = transcriptChars / 4 / 1000;
  const base = FLOOR + kTokens * COST_PER_1K_TOKENS_OF_TRANSCRIPT * (enumGroups / 4);
  return Math.round(base * SAFETY * 100) / 100;
}

/**
 * Ask OpenRouter what is left. Returns `ok: true` with `remaining: null` if the balance cannot
 * be read — an unreachable billing endpoint must not block scoring, since the run itself may
 * still work perfectly and failing closed on a health check is its own outage.
 */
export async function checkBudget(estimatedCost: number, apiKey?: string): Promise<BudgetCheck> {
  const key = apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!key) {
    return { ok: false, remaining: null, estimatedCost, message: "No API key is configured, so no run can be started." };
  }

  let remaining: number | null = null;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/credits", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.ok) {
      const j = await res.json();
      const total = j?.data?.total_credits;
      const used = j?.data?.total_usage;
      if (typeof total === "number" && typeof used === "number") remaining = total - used;
    }
  } catch {
    // fall through — unreadable balance is not a reason to refuse
  }

  if (remaining === null) return { ok: true, remaining: null, estimatedCost, message: null };

  if (remaining < estimatedCost) {
    return {
      ok: false,
      remaining,
      estimatedCost,
      message:
        `Not enough API credit to finish this run. Scoring this transcript costs about ` +
        `$${estimatedCost.toFixed(2)} and $${remaining.toFixed(2)} is left. The run was not ` +
        `started, so nothing was charged and no half-finished report was produced. Top up the ` +
        `OpenRouter account and try again.`,
    };
  }

  return { ok: true, remaining, estimatedCost, message: null };
}
