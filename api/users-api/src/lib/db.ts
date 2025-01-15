import type { Database, UserRow } from "@/dbSchema"
import type { Context } from "@/types"
import { ServerError, UnauthorizedError } from "@incmix-api/utils/errors"
import { generateSentryHeaders } from "@incmix-api/utils"

import { D1Dialect } from "@noxharmonium/kysely-d1"
import { getCookie } from "hono/cookie"
import { CamelCasePlugin, Kysely } from "kysely"

export const getDatabase = (c: Context) => {
  return new Kysely<Database>({
    dialect: new D1Dialect({ database: c.env.DB }),
    plugins: [new CamelCasePlugin()],
  })
}

export async function getUserByEmail(c: Context, email: string) {
  const sessionId = getCookie(c, c.env.COOKIE_NAME) ?? null

  if (!sessionId) {
    throw new UnauthorizedError()
  }
  const url = `${c.env.AUTH_URL}/get-user-by-email`

  const sentryHeaders = generateSentryHeaders(c)

  const res = await c.env.AUTH.fetch(url, {
    method: "POST",
    body: JSON.stringify({ email }),
    headers: {
      "content-type": "application/json",
      cookie: `${c.env.COOKIE_NAME}=sessionId`,
      ...sentryHeaders,
    },
  })

  if (!res.ok) throw new ServerError()

  return await res.json<UserRow>()
}
