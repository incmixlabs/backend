import { setupApiMiddleware } from "@incmix-api/utils/middleware"
import type { FastifyInstance } from "fastify"
import { BASE_PATH } from "@/lib/constants"
import { createI18nMiddleware } from "@/middleware/i18n"

export const middlewares = (app: FastifyInstance) => {
  setupApiMiddleware(app, {
    basePath: BASE_PATH,
    serviceName: "intl-api",
    skipAuth: true,
    customI18nMiddleware: createI18nMiddleware,
  })
}
