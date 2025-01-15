import { getSentry } from "@hono/sentry"
import { generateSentryTraceHeader } from "@sentry/utils"
import type { Context } from "hono"

export function generateSentryHeaders(c: Context) {
  const sentry = getSentry(c)
  const context = sentry.getPropagationContext()
  return {
    "sentry-trace": generateSentryTraceHeader(
      context.traceId,
      context.spanId,
      context.sampled
    ),
  }
}
