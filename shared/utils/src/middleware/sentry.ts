import type { FastifyInstance, FastifyPluginCallback } from "fastify"
import fp from "fastify-plugin"

export interface SentryConfig {
  dsn?: string
  serviceName: string
  environment?: string
}

/**
 * Setup Sentry middleware for error tracking
 */
export const setupSentryMiddleware: FastifyPluginCallback<SentryConfig> = fp(
  (fastify: FastifyInstance, opts: SentryConfig) => {
    if (!opts.dsn) {
      fastify.log.warn("Sentry DSN not provided, skipping Sentry setup")
      return
    }

    // TODO: Implement Sentry integration for Fastify
    fastify.log.info(`Sentry middleware setup for ${opts.serviceName}`)
  },
  { name: "sentry-middleware" }
)
