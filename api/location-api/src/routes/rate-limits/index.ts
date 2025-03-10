import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { getLimts } from "./openapi"

const rateLimitRoutes = new OpenAPIHono<HonoApp>()

rateLimitRoutes.openapi(getLimts, (c) => {
  return c.json(
    { time: Number(c.env.RATE_LIMIT_PERIOD), limit: Number(c.env.RATE_LIMIT) },
    200
  )
})

export default rateLimitRoutes
