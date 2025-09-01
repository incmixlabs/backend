import { OpenAPIHono } from "@hono/zod-openapi"
import type { HonoApp } from "@/types"
import { getLimts } from "./openapi"

const rateLimitRoutes = new OpenAPIHono<HonoApp>()

rateLimitRoutes.openapi(getLimts, (c) => {
  return c.json(
    {
      time: 100,
      limit: 100,
    },
    200
  )
})

export default rateLimitRoutes
