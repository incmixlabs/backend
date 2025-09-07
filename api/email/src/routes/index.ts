import type { FastifyInstance } from "fastify"
import { BASE_PATH } from "@/lib/constants"
import emailRoutes from "./email"
import healthcheckRoutes from "./healthcheck"
// import webhookRoutes from "./webhook"

export const routes = async (app: FastifyInstance) => {
  await app.register(emailRoutes, { prefix: BASE_PATH })
  // await app.register(webhookRoutes, { prefix: `${BASE_PATH}/webhooks` })
  await app.register(healthcheckRoutes, { prefix: `${BASE_PATH}/healthcheck` })
}
