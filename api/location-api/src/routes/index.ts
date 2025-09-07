import type { FastifyInstance } from "fastify"
import { BASE_PATH } from "@/lib/constants"
import healthcheckRoutes from "./healthcheck"
import newsRoutes from "./news"
import rateLimitRoutes from "./rate-limits"
import weatherRoutes from "./weather"

export const routes = async (app: FastifyInstance) => {
  await app.register(weatherRoutes, { prefix: `${BASE_PATH}/weather` })
  await app.register(newsRoutes, { prefix: `${BASE_PATH}/news` })
  await app.register(rateLimitRoutes, { prefix: `${BASE_PATH}/rate-limits` })
  await app.register(healthcheckRoutes, { prefix: `${BASE_PATH}/healthcheck` })
}
