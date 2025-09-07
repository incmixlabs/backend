import { createService } from "@incmix-api/utils"
import { BASE_PATH } from "@/lib/constants"
import { middlewares } from "@/middleware"
import { routes } from "@/routes"

import { envVars } from "./env-vars"

const service = createService({
  name: "org-api",
  port: envVars.PORT,
  basePath: BASE_PATH,
  setupMiddleware: (app) => {
    middlewares(app)
  },
  bindings: envVars,
  needRBAC: true,
  setupRoutes: (app) => {
    routes(app)
  },
})

let _appInstance: any

service.then(({ app, startServer }) => {
  _appInstance = app
  startServer()
})

export default service
