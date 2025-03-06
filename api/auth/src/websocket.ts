import type { OpenAPIHono } from "@hono/zod-openapi"
import { getCookie } from "hono/cookie"
import { BASE_PATH, ONLINE_USERS } from "./lib/constants"
import { initializeLucia } from "./lib/lucia"
import type { HonoApp } from "./types"

export const setupWebsocket = (app: OpenAPIHono<HonoApp>) => {
  app.get(`${BASE_PATH}/connect`, async (c) => {
    const upgradeHeader = c.req.header("Upgrade")
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return c.json({ message: "Expected Upgrade: websocket" }, 426)
    }
    const sessionId = getCookie(c, c.env.COOKIE_NAME)
    const lucia = initializeLucia()
    const { session } = await lucia.validateSession(sessionId ?? "")

    if (!session?.userId) return c.json({ message: "Unauthorized" })

    const id = c.env.CLIENTS.idFromName(ONLINE_USERS)
    const clientInstance = c.env.CLIENTS.get(id)
    return await clientInstance.fetch(
      `${c.req.url}?userId=${session.userId}`,
      c.req.raw
    )
  })
}
