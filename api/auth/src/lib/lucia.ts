import type { Context } from "@/types"
import type { UserType } from "@incmix/utils/types"
import { NodePostgresAdapter } from "@lucia-auth/adapter-postgresql"
import { env } from "hono/adapter"
import { setCookie } from "hono/cookie"
import { Lucia, type SessionCookieAttributesOptions } from "lucia"
import postgres from "pg"

interface DatabaseUserAttributes {
  id: string
  email: string
  email_verified_at: Date
  user_type: UserType
}

declare module "lucia" {
  interface Register {
    Lucia: ReturnType<typeof initializeLucia>
    DatabaseUserAttributes: DatabaseUserAttributes
  }
}
export function initializeLucia(c: Context) {
  const pool = new postgres.Pool({
    connectionString: env(c).DATABASE_URL,
  })
  const adapter = new NodePostgresAdapter(pool, {
    user: "users",
    session: "sessions",
  })
  const attributes: SessionCookieAttributesOptions = {
    secure: true,
    sameSite: "none",
  }
  if (!env(c).DOMAIN.includes("localhost")) {
    attributes.domain = env(c).DOMAIN
  }
  return new Lucia(adapter, {
    sessionCookie: {
      name: env(c).COOKIE_NAME,
      attributes,
    },

    getUserAttributes: (attributes) => {
      console.log(attributes)
      return {
        id: attributes.id,
        email: attributes.email,
        emailVerified: Boolean(attributes.email_verified_at),
        userType: attributes.user_type,
      }
    },
  })
}

export async function createSession(c: Context, userId: string) {
  const lucia = initializeLucia(c)
  const session = await lucia.createSession(userId, {})

  const sessionCookie = lucia.createSessionCookie(session.id)
  setCookie(
    c,
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  )
  return session
}
