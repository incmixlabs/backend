import type { FastifyInstance } from "fastify"
import { setupEmailRoutes } from "./email"
import { setupHealthcheckRoutes } from "./healthcheck"
// import { setupWebhookRoutes } from "./webhook"

export const setupRoutes = async (app: FastifyInstance) => {
  await app.register(
    async (fastify) => {
      await setupEmailRoutes(fastify)
      await setupHealthcheckRoutes(fastify)
      // await setupWebhookRoutes(fastify)
    },
    { prefix: "/api/email" }
  )
}
