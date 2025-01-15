import { OpenAPIHono } from "@hono/zod-openapi"
import { KVStore } from "@incmix-api/utils/kv-store"
import { setupKvStore } from "@incmix-api/utils/middleware"
import { BASE_PATH } from "./lib/constants"
import { middlewares } from "./middleware"
import { routes } from "./routes"
import type { HonoApp } from "./types"

const app = new OpenAPIHono<HonoApp>()

const globalStore = new KVStore()

setupKvStore(app, BASE_PATH, globalStore)
middlewares(app)
routes(app)
export default app
