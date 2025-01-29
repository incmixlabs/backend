import { getSentry } from "@hono/sentry"
import type { OpenAPIHono } from "@hono/zod-openapi"
// import {
//   generateSentryTraceHeader,
//   propagationContextFromHeaders,
// } from "@sentry/utils"
import type { Context, Env } from "hono"

export function setupSentryMiddleware<T extends Env>(
  app: OpenAPIHono<T>,
  basePath: string,
  _service?: string
) {
  // app.use(`${basePath}/*`, sentryMiddleware({ tracesSampleRate: 1.0 }))
  app.use(`${basePath}/*`, async (_c, next) => {
    // const sentry = getSentry(c)

    // if (service) sentry.setTag("service", service)
    // const trace = c.req.header("sentry-trace")
    // const baggage = c.req.header("baggage")
    // const propContext = propagationContextFromHeaders(trace, baggage)
    // sentry.setPropagationContext(propContext)

    await next()
  })
}

export function logSentryError(
  c: Context,
  error: unknown,
  sentryFingerPrint?: string[]
) {
  const sentry = getSentry(c)
  if (sentryFingerPrint?.length) sentry.setFingerprint(sentryFingerPrint)
  sentry.captureException(error)
}
