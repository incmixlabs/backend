import type { FastifyInstance, FastifyPluginCallback } from "fastify"

// Mock session store - in a real app this would be in a database
const sessionStore = new Map<
  string,
  {
    userId: string
    email: string
    fullName: string
  }
>()

const authRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _options,
  done
) => {
  const getCurrentUser = (request: any, reply: any) => {
    // Check for session cookie
    const sessionCookie = request.cookies?.session

    if (!sessionCookie) {
      return reply.code(401).send({ message: "Unauthorized" })
    }

    // Get user data from session store
    const sessionData = sessionStore.get(sessionCookie)
    if (!sessionData) {
      return reply.code(401).send({ message: "Invalid session" })
    }

    return reply.send({
      email: sessionData.email,
      fullName: sessionData.fullName,
      id: sessionData.userId,
      session: {
        id: sessionCookie,
      },
    })
  }

  // GET / - Get current user info (root auth endpoint)
  fastify.get("/", getCurrentUser)

  // GET /me - Get current user info (alternative endpoint)
  fastify.get("/me", getCurrentUser)

  // POST /signup - User registration
  fastify.post("/signup", (request, reply) => {
    try {
      const body = request.body as any

      // Email format validation
      if (!body.email || !body.email.includes("@")) {
        return reply.code(422).send({
          message: "Invalid email format",
        })
      }

      // Check for duplicate email (mock check)
      // In real implementation, this would check the database
      if (body.email === "duplicate@example.com") {
        return reply.code(409).send({
          message: "Email already exists",
        })
      }

      return reply.code(201).send({
        id: `user-${Date.now()}`,
        email: body.email,
        name: body.fullName,
      })
    } catch (_error) {
      return reply.code(500).send({ message: "Internal server error" })
    }
  })

  // POST /login - User login
  fastify.post("/login", (request, reply) => {
    try {
      const body = request.body as any

      // Mock authentication logic
      if (body.email === "nonexistent@example.com") {
        return reply.code(401).send({ message: "Invalid credentials" })
      }

      if (body.password === "wrongpassword") {
        return reply.code(401).send({ message: "Invalid credentials" })
      }

      // Generate session ID
      const sessionId = `session-${Date.now()}`

      // Store session data (in real app, this would be in database)
      sessionStore.set(sessionId, {
        userId: `user-${Date.now()}`,
        email: body.email,
        fullName: "Me User", // This should come from user database
      })

      // Set session cookie
      reply.setCookie("session", sessionId, {
        httpOnly: true,
        secure: false, // Set to true in production
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      })

      return reply.code(200).send({
        email: body.email,
        session: {
          id: sessionId,
        },
      })
    } catch (_error) {
      return reply.code(500).send({ message: "Internal server error" })
    }
  })

  // POST /logout - User logout
  fastify.post("/logout", (request, reply) => {
    try {
      const sessionCookie = request.cookies?.session

      if (!sessionCookie) {
        return reply.code(401).send({ message: "Not authenticated" })
      }

      // Remove session from store
      sessionStore.delete(sessionCookie)

      // Clear session cookie
      reply.clearCookie("session")

      return reply.code(200).send({ message: "Logout successful" })
    } catch (_error) {
      return reply.code(500).send({ message: "Internal server error" })
    }
  })

  // DELETE /delete - Delete user account
  fastify.delete("/delete", (request, reply) => {
    try {
      const sessionCookie = request.cookies?.session

      if (!sessionCookie) {
        return reply.code(401).send({ message: "Not authenticated" })
      }

      // Remove session from store
      sessionStore.delete(sessionCookie)

      // Clear session cookie after account deletion
      reply.clearCookie("session")

      return reply.code(200).send({ message: "Account deleted successfully" })
    } catch (_error) {
      return reply.code(500).send({ message: "Internal server error" })
    }
  })

  // POST /forgot-password - Forgot password
  fastify.post("/forgot-password", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // GET /providers - OAuth providers
  fastify.get("/providers", (_request, reply) => {
    return reply.send({
      google: {
        enabled: true,
        url: "/api/auth/google",
      },
    })
  })
  done()
}

export default authRoutes
