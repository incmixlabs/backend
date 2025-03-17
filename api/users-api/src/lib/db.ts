import type { Database, UserRow } from "@/dbSchema"
import type { Context } from "@/types"
import { generateSentryHeaders } from "@incmix-api/utils"
import { ServerError, UnauthorizedError } from "@incmix-api/utils/errors"

import { envVars } from "@/env-vars"
import { getCookie } from "hono/cookie"
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely"
import pg from "pg"

const pool = new pg.Pool({
  connectionString: envVars.DATABASE_URL,
})

const dialect = new PostgresDialect({ pool })

export const db = new Kysely<Database>({
  dialect,
  plugins: [new CamelCasePlugin()],
})

export async function getUserByEmail(c: Context, email: string) {
  const sessionId = getCookie(c, c.env.COOKIE_NAME) ?? null

  if (!sessionId) {
    throw new UnauthorizedError()
  }
  const url = `${envVars.AUTH_URL}/get-user-by-email`

  const sentryHeaders = generateSentryHeaders(c)

  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ email }),
    headers: {
      "content-type": "application/json",
      cookie: `${envVars.COOKIE_NAME}=${sessionId}`,
      ...sentryHeaders,
    },
  })

  if (!res.ok) throw new ServerError()

  return (await res.json()) as UserRow
}
