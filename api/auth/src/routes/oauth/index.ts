import { generateCodeVerifier, generateState, OAuth2RequestError } from "arctic"
import type { FastifyInstance } from "fastify"
import { createSession } from "@/auth/session"
import { insertOAuthUser } from "@/lib/helper"
import { initializeGoogleAuth } from "@/lib/oauth"
import { setSessionCookie } from "@/middleware/auth"
import { envVars } from "../../env-vars"

export const setupOAuthRoutes = (app: FastifyInstance) => {
  // Google OAuth login
  app.get(
    "/google/login",
    {
      schema: {
        description: "Initiate Google OAuth login",
        tags: ["oauth"],
        response: {
          200: {
            type: "object",
            properties: {
              authUrl: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const clientType = request.headers["x-client-type"]
        const google = initializeGoogleAuth(request as any, {
          isTauri: clientType === "desktop",
        })
        const state = generateState()
        const codeVerifier = generateCodeVerifier()
        const url = google.createAuthorizationURL(state, codeVerifier, [
          "email",
          "profile",
        ])

        // Set secure cookies for state and code verifier
        const domain = envVars.DOMAIN
        const isIp = domain ? /^\d{1,3}(\.\d{1,3}){3}$/.test(domain) : false
        const domainPart =
          domain && !/localhost/i.test(domain) && !isIp
            ? `; Domain=${domain}`
            : ""
        const securePart = envVars.NODE_ENV === "prod" ? "; Secure" : ""

        reply.header("Set-Cookie", [
          `state=${state}; Path=/; HttpOnly; SameSite=None; Max-Age=600${securePart}${domainPart}`,
          `code_verifier=${codeVerifier}; Path=/; HttpOnly; SameSite=None; Max-Age=600${securePart}${domainPart}`,
        ])

        return { authUrl: url.toString() }
      } catch (error) {
        console.error("Google OAuth error:", error)
        throw error
      }
    }
  )

  // Google OAuth callback
  app.get(
    "/google/callback",
    {
      schema: {
        description: "Handle Google OAuth callback",
        tags: ["oauth"],
        querystring: {
          type: "object",
          properties: {
            code: { type: "string" },
            state: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              emailVerified: { type: "boolean" },
              isSuperAdmin: { type: "boolean" },
              session: { type: "object" },
            },
          },
          400: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { code, state } = request.query as {
          code?: string
          state?: string
        }

        if (!code || !state) {
          return reply
            .status(400)
            .send({ message: "Missing code or state parameter" })
        }

        // Get state and code verifier from cookies
        const cookies = request.headers.cookie
        if (!cookies) {
          return reply
            .status(400)
            .send({ message: "Missing authentication cookies" })
        }

        const stateCookie = cookies
          .split("; ")
          .find((row) => row.startsWith("state="))
          ?.split("=")[1]

        const codeVerifierCookie = cookies
          .split("; ")
          .find((row) => row.startsWith("code_verifier="))
          ?.split("=")[1]

        if (!stateCookie || !codeVerifierCookie) {
          return reply
            .status(400)
            .send({ message: "Missing state or code verifier" })
        }

        // Validate state
        if (state !== stateCookie) {
          return reply.status(400).send({ message: "Invalid state parameter" })
        }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        try {
          // Initialize Google OAuth client
          const clientType = request.headers["x-client-type"]
          const google = initializeGoogleAuth(request as any, {
            isTauri: clientType === "desktop",
          })

          // Exchange code for tokens
          const tokens = await google.validateAuthorizationCode(
            code,
            codeVerifierCookie
          )

          // Get user info from Google
          const googleUserResponse = await fetch(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
              headers: {
                Authorization: `Bearer ${tokens.accessToken}`,
              },
            }
          )

          const googleUser = (await googleUserResponse.json()) as {
            id: string
            email: string
            verified_email: boolean
            name: string
            picture?: string
          }

          if (!googleUser.verified_email) {
            return reply
              .status(400)
              .send({ message: "Google email not verified" })
          }

          // Create or update user in database
          const user = await insertOAuthUser(
            "google",
            {
              fullName: googleUser.name,
              email: googleUser.email,
              avatar: googleUser.picture,
            },
            googleUser.id,
            request as any
          )

          // Check if user is active
          if (!user.isActive) {
            return reply
              .status(400)
              .send({ message: "User account is deactivated" })
          }

          // Create session
          const session = await createSession(request.context.db, user.id)

          // Set session cookie
          setSessionCookie(reply, session.id, new Date(session.expiresAt))

          // Clear ephemeral OAuth cookies
          {
            const domain = envVars.DOMAIN
            const isIp = domain ? /^\d{1,3}(\.\d{1,3}){3}$/.test(domain) : false
            const domainPart =
              domain && !/localhost/i.test(domain) && !isIp
                ? `; Domain=${domain}`
                : ""
            const securePart = envVars.NODE_ENV === "prod" ? "; Secure" : ""
            reply.header("Set-Cookie", [
              `state=; Path=/; HttpOnly; SameSite=None; Max-Age=0${securePart}${domainPart}`,
              `code_verifier=; Path=/; HttpOnly; SameSite=None; Max-Age=0${securePart}${domainPart}`,
            ])
          }

          return {
            id: user.id,
            email: user.email,
            emailVerified: Boolean(user.emailVerifiedAt),
            isSuperAdmin: user.isSuperAdmin,
            session: {
              id: session.id,
              expiresAt: session.expiresAt,
            },
          }
        } catch (error) {
          if (error instanceof OAuth2RequestError) {
            return reply
              .status(400)
              .send({ message: "Invalid authorization code" })
          }
          throw error
        }
      } catch (error) {
        console.error("Google OAuth callback error:", error)
        throw error
      }
    }
  )
}
