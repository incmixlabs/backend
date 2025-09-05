import { setupApiMiddleware } from "@incmix-api/utils/middleware"
import type { AjvOpenApiHono } from "@incmix-api/utils/openapi/ajv-openapi"
import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"

export const middlewares = (app: AjvOpenApiHono<HonoApp>) => {
  setupApiMiddleware(app, {
    basePath: BASE_PATH,
    serviceName: "files-api",
    corsFirst: true,
  })
}
