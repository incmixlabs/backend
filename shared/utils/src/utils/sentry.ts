import type { FastifyRequest } from "fastify"

export function generateSentryHeaders(_request: FastifyRequest) {
  // TODO: Implement proper Sentry trace header generation for Fastify
  // For now, return empty headers
  return {
    "sentry-trace": "",
  }
}
