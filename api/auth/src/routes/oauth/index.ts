import type { FastifyInstance } from "fastify"

export const setupOAuthRoutes = async (app: FastifyInstance) => {
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
    async (_request, _reply) => {
      try {
        // TODO: Implement Google OAuth flow
        // const clientType = request.headers["x-client-type"]
        // const google = initializeGoogleAuth({ isTauri: clientType === "desktop" })
        // const state = generateState()
        // const codeVerifier = generateCodeVerifier()
        // const url = google.createAuthorizationURL(state, codeVerifier, ["email", "profile"])

        return { authUrl: "https://accounts.google.com/oauth/authorize" }
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

        // TODO: Implement Google OAuth callback handling
        // const stateCookie = request.cookies.state
        // const codeVerifierCookie = request.cookies.code_verifier
        // Validate state and code verifier
        // Exchange code for tokens
        // Get user info from Google
        // Create or update user in database
        // Create session and set cookies

        return {
          id: "user-id",
          email: "user@example.com",
          emailVerified: true,
          isSuperAdmin: false,
          session: { id: "session-id" },
        }
      } catch (error) {
        console.error("Google OAuth callback error:", error)
        throw error
      }
    }
  )
}
