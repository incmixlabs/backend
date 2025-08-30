import type { FastifyInstance, FastifyRequest } from "fastify"
import fp from "fastify-plugin"

export async function setupSentryMiddleware(
  app: FastifyInstance,
  _basePath: string,
  service?: string
) {
  // TODO: Implement Sentry for Fastify
  // For now, just log that Sentry is not yet configured
  await app.register(
    fp(async (fastify) => {
      fastify.addHook("onRequest", async (request, _reply) => {
        // Placeholder for Sentry integration
        // Will need to use @sentry/node directly or find a Fastify plugin
        if (service) {
          request.log.info({ service }, "Service request")
        }
      })

      fastify.addHook("onError", async (request, _reply, error) => {
        // Log errors that would be sent to Sentry
        request.log.error({ error, service }, "Request error")
      })
    })
  )
}

export function logSentryError(
  request: FastifyRequest,
  error: unknown,
  sentryFingerPrint?: string[]
) {
  // TODO: Implement Sentry error logging for Fastify
  request.log.error({ error, sentryFingerPrint }, "Sentry error")
}
