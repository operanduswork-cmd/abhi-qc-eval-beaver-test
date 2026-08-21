import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: { staleTimes: { dynamic: 0 } },
  /**
   * app/index.html is read with readFileSync at request time and never imported, so Next's
   * dependency tracing cannot see it and would omit it from the deployment bundle — the routes
   * build fine and then 500 in production on a missing file. Trace it explicitly.
   */
  outputFileTracingIncludes: {
    "/": ["./app/index.html"],
    "/runs/[id]": ["./app/index.html"],
    "/new": ["./app/index.html"],
  },
};

export default config;
