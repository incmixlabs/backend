import { BASE_PATH } from "@/lib/constants"

import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { KVStore } from "@incmix-api/utils/kv-store"
import { setupKvStore } from "@incmix-api/utils/middleware"
import { setupWebsocket } from "./websocket"

const app = new OpenAPIHono<HonoApp>()

const globalStore = new KVStore()

setupKvStore(app, BASE_PATH, globalStore)

setupWebsocket(app)
middlewares(app)

routes(app)

export default app

export { Clients } from "./durable-objects/clients"
