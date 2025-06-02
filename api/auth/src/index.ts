import { envVars } from "@/env-vars"
import { BASE_PATH } from "@/lib/constants"
import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import type { HonoApp } from "@/types"
import { serve } from "@hono/node-server"
import { OpenAPIHono } from "@hono/zod-openapi"
import { KVStore } from "@incmix-api/utils/kv-store"
import { setupKvStore } from "@incmix-api/utils/middleware"
import {} from "hono/"
const app = new OpenAPIHono<HonoApp>()

const globalStore = new KVStore()

setupKvStore(app, BASE_PATH, globalStore)

middlewares(app)

routes(app)

serve({ fetch: app.fetch, port: envVars.PORT }, (info) => {
  console.log(`Server is running on port ${info.port}`)
})
export default app
