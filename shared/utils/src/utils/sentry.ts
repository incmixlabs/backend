import type { FastifyRequest } from "fastify"

export function generateSentryHeaders(
  request: FastifyRequest
): Record<string, string> {
  // Pass through Sentry propagation headers if present; otherwise omit.
  const headers: Record<string, string> = {}
  const trace = request.headers["sentry-trace"]
  if (typeof trace === "string" && trace) headers["sentry-trace"] = trace
  const baggage = request.headers["baggage"]
  if (typeof baggage === "string" && baggage) headers["baggage"] = baggage
  return headers
}
