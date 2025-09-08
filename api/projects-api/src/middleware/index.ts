import { setupApiMiddleware } from "@incmix-api/utils/middleware"
import type { FastifyInstance } from "fastify"
import { BASE_PATH } from "@/lib/constants"

export const middlewares = async (app: FastifyInstance) => {
  await setupApiMiddleware(app, {
    basePath: BASE_PATH,
    serviceName: "projects-api",
  })
}
