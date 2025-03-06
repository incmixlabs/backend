import { BASE_PATH } from "@/lib/constants"
import "@/env-vars"
import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import type { HonoApp } from "@/types"
// import { setupWebsocket } from "./websocket"
import { serve } from "@hono/node-server"
import { OpenAPIHono } from "@hono/zod-openapi"
import { KVStore } from "@incmix-api/utils/kv-store"
import { setupKvStore } from "@incmix-api/utils/middleware"

const app = new OpenAPIHono<HonoApp>()

const globalStore = new KVStore()

setupKvStore(app, BASE_PATH, globalStore)

// setupWebsocket(app)
middlewares(app)

routes(app)

serve({ fetch: app.fetch, port: 8787 }, (info) => {
  console.log(`Server is running on port ${info.port}`)
})
export default app

// export { Clients } from "./durable-objects/clients"
