import { setupApiMiddleware } from "@incmix-api/utils/middleware"
import type { FastifyInstance } from "fastify"
import { BASE_PATH } from "@/lib/constants"

export const middlewares = (app: FastifyInstance) => {
  setupApiMiddleware(app, {
    basePath: BASE_PATH,
    serviceName: "genai-api",
    corsFirst: true,
  })
}
