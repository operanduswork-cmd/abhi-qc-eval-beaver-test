/**
 * OpenRouter client. Every constant here traces to a Block 0 probe — see probes/RESULTS.md.
 */

export const MODEL = "anthropic/claude-opus-5";
export const SCORER_VERSION = "0.1.0";

/**
 * M1 verified live: `anthropic/claude-opus-5` is served by NINE endpoints under price-weighted
 * load balancing. Three (Google/Vertex) do NOT support structured_outputs — the score enum
 * would silently degrade to a hint and an excluded value becomes emittable. Two (Azure) accept
 * `temperature`. Unpinned, the reproducibility claim is indefensible.
 *
 * `require_parameters: true` is the important half: it makes OpenRouter refuse an endpoint that
 * cannot honour the request rather than quietly dropping the parameter.
 */
export const PROVIDER_PIN = {
  only: ["anthropic"],
  allow_fallbacks: false,
  require_parameters: true,
} as const;

/**
 * There is deliberately no `temperature` anywhere in this file.
 *
 * It is REMOVED on Opus 5 — 400 on the first-party API, silently dropped through OpenRouter's
 * Anthropic endpoint. "Set temperature=0 for determinism" is not available to us. Determinism
 * here is engineered instead: fixed enums, all arithmetic in code, evidence gating, and
 * content-hash idempotency. Never a sampling knob.
 *
 * M1 also found the naive effort model is backwards: the no-parameter default already produces
 * ~104 reasoning tokens against `high`'s ~107, so `high` buys almost nothing while `low` (~69)
 * is the real lever. Default to "low" for mechanical passes and reserve higher tiers for the
 * genuinely hard ones.
 */
export type Effort = "low" | "medium" | "high";

export interface CacheableBlock {
  text: string;
  /**
   * ttl "1h" costs 2x on write versus 1.25x for the 5-minute default, but a re-run of the same
   * transcript minutes later then reads instead of writing — and 5m is exactly the Vercel
   * maxDuration, so the default would expire mid-demo.
   */
  cache?: boolean;
}

export interface CallOptions {
  /** Shared prefix (preamble + transcript). Cached. Identical across all calls in a run. */
  prefix: string;
  /** Per-call question. Cheap, uncached, sits after the breakpoint. */
  question: string;
  /**
   * M2b: the schema NAME does not invalidate the prompt cache but the ENUM does. So every
   * dimension uses the SAME name and varies only the enum, and calls are ordered so that
   * same-enum dimensions run consecutively. Coaching has 4 distinct enums across 12
   * dimensions, kickoff 7 — so coaching pays 4 cache misses, not 12.
   */
  schema: Record<string, unknown>;
  effort?: Effort;
  maxTokens?: number;
  /** Sticky routing. Pass the run id so every call in a run lands on the same instance. */
  sessionId?: string;
  signal?: AbortSignal;
}

export interface CallResult<T = unknown> {
  ok: boolean;
  data: T | null;
  http: number | null;
  finishReason: string | null;
  resolvedProvider: string | null;
  generationId: string | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    reasoningTokens: number;
    cachedTokens: number;
    cost: number;
  };
  error: string | null;
  ms: number;
}

/** Property order IS generation order under constrained decoding. Evidence first, score last. */
export const SHARED_SCHEMA_NAME = "dimension_result";

export class ProviderError extends Error {
  // Plain field, not a constructor parameter property: Node's strip-only TypeScript mode
  // cannot compile parameter properties, and the probes/eval run straight through Node.
  detail: unknown;
  constructor(message: string, detail: unknown) {
    super(message);
    this.name = "ProviderError";
    this.detail = detail;
  }
}

/**
 * Transport errors ("fetch failed", ECONNRESET) are transient and unrelated to the request.
 * A single blip must never be allowed to look like a finding: on the first real run one dropped
 * the fact pass, which emptied every cap enumeration, which fired five maximum penalties on a
 * call that had not earned any of them.
 */
const TRANSPORT_RETRIES = 2;

export async function callModel<T = unknown>(opts: CallOptions): Promise<CallResult<T>> {
  let last: CallResult<T> = blank(Date.now(), "not attempted") as CallResult<T>;
  for (let attempt = 0; attempt <= TRANSPORT_RETRIES; attempt++) {
    last = await callOnce<T>(opts);
    // Only a transport-level failure is worth retrying. An HTTP or schema error will repeat.
    if (last.ok || last.http !== null) return last;
    if (attempt < TRANSPORT_RETRIES) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return last;
}

async function callOnce<T = unknown>(opts: CallOptions): Promise<CallResult<T>> {
  const started = Date.now();
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");

  const body = {
    model: MODEL,
    provider: PROVIDER_PIN,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: opts.prefix, cache_control: { type: "ephemeral", ttl: "1h" } },
          { type: "text", text: opts.question },
        ],
      },
    ],
    response_format: opts.schema,
    reasoning: { effort: opts.effort ?? "low" },
    max_tokens: opts.maxTokens ?? 4000,
    ...(opts.sessionId ? { session_id: opts.sessionId } : {}),
  };

  let res: Response, text: string, json: any;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        // ASCII only — headers are ByteString (latin-1); an em-dash here throws at fetch time.
        "X-Title": "BeaverMind QC Evaluator",
      },
      body: JSON.stringify(body),
      ...(opts.signal ? { signal: opts.signal } : {}),
    });
    text = await res.text();
    try { json = JSON.parse(text); } catch { json = null; }
  } catch (err) {
    return blank(started, String(err));
  }

  const choice = json?.choices?.[0];
  const u = json?.usage ?? {};
  const usage = {
    promptTokens: u.prompt_tokens ?? 0,
    completionTokens: u.completion_tokens ?? 0,
    reasoningTokens: u.completion_tokens_details?.reasoning_tokens ?? 0,
    cachedTokens: u.prompt_tokens_details?.cached_tokens ?? 0,
    cost: u.cost ?? 0,
  };

  const base = {
    http: res.status,
    finishReason: choice?.finish_reason ?? null,
    resolvedProvider: json?.provider ?? null,
    generationId: json?.id ?? null,
    usage,
    ms: Date.now() - started,
  };

  if (!res.ok || json?.error) {
    return { ...base, ok: false, data: null, error: JSON.stringify(json?.error ?? text.slice(0, 500)) };
  }

  /**
   * OpenRouter delivers mid-stream provider failures as finish_reason "error", NOT as an HTTP
   * error. A try/catch alone accepts a truncated response as a success and silently mis-scores
   * the dimension — a wrong number that looks exactly like a right one.
   */
  if (choice?.finish_reason === "error") {
    return { ...base, ok: false, data: null, error: `provider failed mid-stream: ${JSON.stringify(choice)}` };
  }
  if (choice?.finish_reason === "length") {
    return { ...base, ok: false, data: null, error: "response truncated at max_tokens; raise the budget" };
  }

  let data: T | null = null;
  try {
    data = JSON.parse(choice?.message?.content ?? "");
  } catch {
    return { ...base, ok: false, data: null, error: "structured output was not valid JSON" };
  }

  return { ...base, ok: true, data, error: null };
}

function blank(started: number, error: string): CallResult<never> {
  return {
    ok: false, data: null, http: null, finishReason: null, resolvedProvider: null,
    generationId: null,
    usage: { promptTokens: 0, completionTokens: 0, reasoningTokens: 0, cachedTokens: 0, cost: 0 },
    error, ms: Date.now() - started,
  };
}

/**
 * Assert the prompt cache is actually engaging. In dev this must fail loudly: a zero here on
 * call 2..N means a silent invalidator (a timestamp, a run id, unsorted JSON keys) has leaked
 * into the shared prefix, and the only symptom would otherwise be a 5x cost increase nobody
 * notices until the bill.
 */
export function assertCacheEngaged(r: CallResult, callIndex: number, sameEnumAsPrevious: boolean): void {
  if (process.env.NODE_ENV === "production") return;
  if (callIndex === 0 || !sameEnumAsPrevious) return; // a new enum group legitimately writes
  if (r.usage.cachedTokens === 0) {
    throw new Error(
      `prompt cache did not engage on call ${callIndex} despite an unchanged enum group. ` +
      `Something non-deterministic leaked into the cached prefix.`,
    );
  }
}
