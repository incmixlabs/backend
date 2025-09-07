import { createService } from "@incmix-api/utils"
import { BASE_PATH } from "@/lib/constants"
import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import type { Bindings, Variables } from "@/types"
import { envVars } from "./env-vars"

const main = async () => {
  const service = await createService<Bindings, Variables>({
    name: "rxdb-api",
    port: envVars.PORT,
    basePath: BASE_PATH,
    setupMiddleware: async (app) => {
      await middlewares(app)
    },
    setupRoutes: (app) => routes(app),
    bindings: envVars,
  })

  const { app, startServer } = service

  await startServer()

  return app
}

const appPromise = main()

export default appPromise
