// Shared OpenRouter client for the Block 0 probes.
// No dependencies — Node 22 has global fetch. There is no package.json yet by design;
// the probes must be runnable before any scaffold exists.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, "..");

export function env(name) {
  const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    if (line.slice(0, i).trim() === name) return line.slice(i + 1).trim();
  }
  throw new Error(`${name} not set in .env.local`);
}

export const MODEL = "anthropic/claude-opus-5";

// Correction #2: anthropic/claude-opus-5 is served by NINE endpoints under price-weighted
// load balancing. Three (Google/Vertex) do not support structured_outputs — the score enum
// would silently degrade to a hint. Two (Azure) accept temperature. Unpinned, the
// determinism claim is indefensible. Verified live against /models/.../endpoints.
export const PROVIDER_PIN = {
  only: ["anthropic"],
  allow_fallbacks: false,
  require_parameters: true,
};

// NOTE: `temperature` is deliberately absent everywhere. It is removed on Opus 5 —
// 400 on first-party, silently dropped through OpenRouter. Determinism here is
// engineered (fixed enums, arithmetic in code, evidence gating), never a sampling knob.
export async function call(body, { label = "" } = {}) {
  const started = Date.now();
  let res, json, text;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env("OPENROUTER_API_KEY")}`,
        "Content-Type": "application/json",
        "X-Title": "BeaverMind QC Evaluator - Block 0 probe",  // ASCII only: headers are ByteString (latin-1)
      },
      body: JSON.stringify({ model: MODEL, provider: PROVIDER_PIN, ...body }),
    });
    text = await res.text();
    try { json = JSON.parse(text); } catch { json = null; }
  } catch (err) {
    return { label, ok: false, transport_error: String(err), ms: Date.now() - started };
  }

  const u = json?.usage ?? {};
  const choice = json?.choices?.[0];

  return {
    label,
    ok: res.ok && !json?.error,
    http: res.status,
    // OpenRouter delivers mid-stream provider failures as finish_reason:"error", NOT an
    // HTTP error. A try/catch alone accepts a truncated response as success.
    finish_reason: choice?.finish_reason ?? null,
    native_finish_reason: choice?.native_finish_reason ?? null,
    error: json?.error ?? (res.ok ? null : text.slice(0, 400)),
    resolved_provider: json?.provider ?? null,
    generation_id: json?.id ?? null,
    usage: {
      prompt_tokens: u.prompt_tokens ?? null,
      completion_tokens: u.completion_tokens ?? null,
      reasoning_tokens: u.completion_tokens_details?.reasoning_tokens ?? null,
      cached_tokens: u.prompt_tokens_details?.cached_tokens ?? null,
      cost: u.cost ?? null,
    },
    content: choice?.message?.content ?? null,
    reasoning: choice?.message?.reasoning ? "<present>" : null,
    ms: Date.now() - started,
  };
}

export function line(r) {
  const u = r.usage ?? {};
  return `  ${String(r.label).padEnd(22)} HTTP ${r.http ?? "—"}  finish=${String(r.finish_reason).padEnd(10)} ` +
    `in=${String(u.prompt_tokens ?? "—").padStart(6)} out=${String(u.completion_tokens ?? "—").padStart(6)} ` +
    `reasoning=${String(u.reasoning_tokens ?? "—").padStart(6)} cached=${String(u.cached_tokens ?? "—").padStart(6)} ` +
    `${r.resolved_provider ?? ""} ${r.ms}ms`;
}
