import { BASE_PATH } from "@/lib/constants"
import { OpenAPIHono } from "@hono/zod-openapi"

import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import type { HonoApp } from "@/types"
import { serve } from "@hono/node-server"
import { setupRbac } from "@incmix-api/utils/authorization"
import { KVStore } from "@incmix-api/utils/kv-store"
import { setupKvStore } from "@incmix-api/utils/middleware"
import { envVars } from "./env-vars"

const app = new OpenAPIHono<HonoApp>()

const globalStore = new KVStore({}, 900)

setupKvStore(app, BASE_PATH, globalStore)

setupRbac(app, BASE_PATH)
middlewares(app)
routes(app)
serve(
  {
    fetch: app.fetch,
    port: envVars.PORT,
  },
  (info) => {
    console.info(`Server is running on port ${info.port}`)
  }
)
export default app
