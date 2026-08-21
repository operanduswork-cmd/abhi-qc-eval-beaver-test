import { createHash } from "node:crypto";

/**
 * Canonicalise a pasted transcript, then hash and line-number THE OUTPUT.
 *
 * Two research reports disagreed on whether the fixtures are CRLF or LF. Canonicalising
 * first makes the question moot: whatever arrives, the same bytes come out, so the same
 * paste always produces the same hash, the same run id, and the same line numbers.
 *
 * Order matters. NFC must run after newline normalisation (it can otherwise interact with
 * combining marks near line boundaries), and trailing-whitespace stripping must run before
 * trailing-blank-line removal or a line of spaces survives as content.
 */
export function canonicalise(input: string): string {
  return input
    .replace(/^﻿/, "")      // strip BOM
    .replace(/\r\n?/g, "\n")     // CRLF and lone CR -> LF
    .normalize("NFC")
    .split("\n")
    .map((line) => line.replace(/[ \t  -   　]+$/u, ""))
    .join("\n")
    .replace(/\n+$/, "");        // drop trailing blank lines
}

/** sha256 of the canonical body. This is the idempotency key, not the raw upload's hash. */
export function sha256(canonical: string): string {
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export interface Canonical {
  body: string;
  sha256: string;
  lineCount: number;
}

export function prepare(input: string): Canonical {
  const body = canonicalise(input);
  return { body, sha256: sha256(body), lineCount: body === "" ? 0 : body.split("\n").length };
}

/**
 * Line-numbered rendering handed to the model. The prefix is `L<n>: ` so a cited number is
 * unambiguous — but note the citation contract: the QUOTE is the key, the line number is only
 * a hint. See lib/scoring/evidence.ts.
 */
export function numbered(body: string): string {
  return body.split("\n").map((l, i) => `L${i + 1}: ${l}`).join("\n");
}
