import type { Context } from "@/types"
import type { UserType } from "@incmix/utils/types"
import { D1Adapter } from "@lucia-auth/adapter-sqlite"
import { setCookie } from "hono/cookie"
import { Lucia, type SessionCookieAttributesOptions } from "lucia"

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
export function initializeLucia(c: Context) {
  const adapter = new D1Adapter(c.env.DB, {
    user: "users",
    session: "sessions",
  })
  const attributes: SessionCookieAttributesOptions = {
    secure: true,
    sameSite: "none",
  }
  if (!c.env.DOMAIN.includes("localhost")) {
    attributes.domain = c.env.DOMAIN
  }
  return new Lucia(adapter, {
    sessionCookie: {
      name: c.env.COOKIE_NAME,
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
