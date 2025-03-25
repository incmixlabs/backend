import { envVars } from "@/env-vars"
import type { Context } from "@/types"
import type { UserType } from "@incmix/utils/types"
import { NodePostgresAdapter } from "@lucia-auth/adapter-postgresql"
import { setCookie } from "hono/cookie"
import { Lucia, type SessionCookieAttributesOptions } from "lucia"
import postgres from "pg"

interface DatabaseUserAttributes {
  id: string
  email: string
  email_verified: number
  user_type: UserType
}

declare module "lucia" {
  interface Register {
    Lucia: ReturnType<typeof initializeLucia>
    DatabaseUserAttributes: DatabaseUserAttributes
  }
}
export function initializeLucia() {
  const pool = new postgres.Pool({
    connectionString: envVars.DATABASE_URL,
  })
  const adapter = new NodePostgresAdapter(pool, {
    user: "users",
    session: "sessions",
  })
  const attributes: SessionCookieAttributesOptions = {
    secure: true,
    sameSite: "none",
  }
  if (!envVars.DOMAIN.includes("localhost")) {
    attributes.domain = envVars.DOMAIN
  }
  return new Lucia(adapter, {
    sessionCookie: {
      name: envVars.COOKIE_NAME,
      attributes,
    },

    getUserAttributes: (attributes) => {
      return {
        id: attributes.id,
        email: attributes.email,
        emailVerified: Boolean(attributes.email_verified),
        userType: attributes.user_type,
      }
    },
  })
}

export async function createSession(c: Context, userId: string) {
  const lucia = initializeLucia()
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
