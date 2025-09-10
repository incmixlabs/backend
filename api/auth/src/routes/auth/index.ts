import type { FastifyInstance } from "fastify"
import { generateRandomId } from "@/auth/utils"
import { authMiddleware } from "@/middleware/auth"
import { envVars } from "../../env-vars"

// Extended register request to include fullName
interface ExtendedRegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  fullName: string
}

interface LoginRequest {
  email: string
  password: string
}

const ExtendedRegisterRequestSchema = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 1, maxLength: 128 },
    firstName: { type: "string", minLength: 1, maxLength: 50 },
    lastName: { type: "string", minLength: 1, maxLength: 50 },
    fullName: { type: "string", minLength: 1, maxLength: 100 },
  },
  required: ["email", "password", "firstName", "lastName", "fullName"],
  additionalProperties: false,
}

export const setupAuthRoutes = async (app: FastifyInstance) => {
  // Get current user endpoint
  app.get(
    "/me",
    {
      schema: {
        description: "Get current authenticated user",
        tags: ["auth"],
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              fullName: { type: "string" },
              emailVerified: { type: "boolean" },
              isSuperAdmin: { type: "boolean" },
            },
          },
          401: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ message: "Unauthorized" })
      }

      return reply.status(200).send({
        id: request.user.id,
        email: request.user.email,
        fullName: request.user.fullName,
        emailVerified: request.user.emailVerified,
        isSuperAdmin: request.user.isSuperAdmin,
      })
    }
  )

  // Validate session endpoint
  app.get(
    "/validate",
    {
      schema: {
        description: "Validate current session",
        tags: ["auth"],
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              session: { type: "object" },
            },
          },
          401: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      // TODO: Add auth middleware to get user and session from request
      return reply.status(401).send({ message: "Unauthorized" })
    }
  )

  // Get user by ID or email
  app.get(
    "/user",
    {
      schema: {
        description: "Get user by ID or email",
        tags: ["auth"],
        querystring: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string", format: "email" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              fullName: { type: "string" },
              email: { type: "string" },
              emailVerified: { type: "boolean" },
              isSuperAdmin: { type: "boolean" },
            },
          },
          400: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          404: {
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
        const { id, email } = request.query as { id?: string; email?: string }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        if (!id && !email) {
          return reply
            .status(400)
            .send({ message: "Either id or email is required" })
        }

        let query = request.context.db
          .selectFrom("users")
          .innerJoin("userProfiles", "users.id", "userProfiles.id")
          .select([
            "users.id",
            "users.email",
            "users.isSuperAdmin",
            "users.emailVerifiedAt",
            "userProfiles.fullName",
            "userProfiles.avatar",
            "userProfiles.profileImage",
            "userProfiles.localeId",
            "userProfiles.onboardingCompleted",
          ])

        if (id) {
          query = query.where("users.id", "=", id)
        } else if (email) {
          query = query.where("users.email", "=", email)
        }

        const searchedUser = await query.executeTakeFirst()

        if (!searchedUser) {
          return reply.code(404).send({ message: "User not found" })
        }

        return {
          id: searchedUser.id,
          fullName: searchedUser.fullName,
          avatar: searchedUser.avatar,
          profileImage: searchedUser.profileImage,
          localeId: searchedUser.localeId,
          onboardingCompleted: searchedUser.onboardingCompleted,
          isSuperAdmin: searchedUser.isSuperAdmin,
          email: searchedUser.email,
          emailVerified: !!searchedUser.emailVerifiedAt,
        }
      } catch (error) {
        console.error("Get user error:", error)
        throw error
      }
    }
  )

  // Signup endpoint
  app.post(
    "/signup",
    {
      schema: {
        description: "Register a new user",
        tags: ["auth"],
        body: ExtendedRegisterRequestSchema,
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              name: { type: "string" },
              emailVerified: { type: "boolean" },
              isSuperAdmin: { type: "boolean" },
            },
          },
          409: {
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
        const { fullName, email, password, firstName, lastName } =
          request.body as ExtendedRegisterRequest

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        const db = request.context.db

        // Check if user already exists
        const existing = await db
          .selectFrom("users")
          .selectAll()
          .where("email", "=", email)
          .executeTakeFirst()

        if (existing) {
          return reply.code(409).send({ message: "User already registered" })
        }

        const userId = generateRandomId(15)

        // Create user and profile in transaction
        const result = await db.transaction().execute(async (tx) => {
          // Hash password using bcrypt
          const bcrypt = await import("bcrypt")
          const hashedPassword = await bcrypt.hash(password, 10)

          // Insert user
          const user = await tx
            .insertInto("users")
            .values({
              id: userId,
              email,
              hashedPassword,
              emailVerifiedAt:
                envVars.NODE_ENV === "test" ? new Date().toISOString() : null,
              isSuperAdmin: false,
              isActive: true,
            })
            .returningAll()
            .executeTakeFirst()

          if (!user) {
            throw new Error("Failed to create user")
          }

          // Insert user profile
          const profile = await tx
            .insertInto("userProfiles")
            .values({
              id: userId,
              fullName,
              email,
              localeId: 1,
              avatar: null,
              profileImage: null,
              onboardingCompleted: false,
            })
            .returningAll()
            .executeTakeFirst()

          return { user, profile }
        })

        if (envVars.NODE_ENV !== "test") {
          // TODO: Implement verification email sending
          // const verificationCode = await generateVerificationCode(userId, email, "email_verification")
          // await sendVerificationEmail(email, verificationCode, userId)
        }

        return reply.code(201).send({
          id: result.user.id,
          isSuperAdmin: result.user.isSuperAdmin,
          email: result.user.email,
          emailVerified: Boolean(result.user.emailVerifiedAt),
          name: fullName,
          localeId: result.profile?.localeId ?? 1,
          profileImage: result.profile?.profileImage ?? null,
          avatar: result.profile?.avatar ?? null,
        })
      } catch (error) {
        console.error("Signup error:", error)
        throw error
      }
    }
  )

  // Login endpoint
  app.post(
    "/login",
    {
      schema: {
        description: "Login with email and password",
        tags: ["auth"],
        body: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 1, maxLength: 128 },
          },
          required: ["email", "password"],
          additionalProperties: false,
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
          401: {
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
        const { email, password } = request.body as LoginRequest

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        const db = request.context.db

        // Find user by email
        const user = await db
          .selectFrom("users")
          .selectAll()
          .where("email", "=", email)
          .where("isActive", "=", true)
          .executeTakeFirst()

        if (!user) {
          return reply.code(401).send({ message: "Invalid credentials" })
        }

        // Verify password
        if (!user.hashedPassword) {
          return reply.code(401).send({ message: "Invalid credentials" })
        }

        const bcrypt = await import("bcrypt")
        const passwordValid = await bcrypt.compare(
          password,
          user.hashedPassword
        )

        if (!passwordValid) {
          return reply.code(401).send({ message: "Invalid credentials" })
        }

        // Create session
        const sessionId = generateRandomId(20)
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

        const session = await db
          .insertInto("sessions")
          .values({
            id: sessionId,
            userId: user.id,
            expiresAt: expiresAt.toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returningAll()
          .executeTakeFirst()

        if (!session) {
          throw new Error("Failed to create session")
        }

        // Set session cookie
        const cookieName = envVars.COOKIE_NAME
        const cookieValue = `${cookieName}=${sessionId}; Domain=${envVars.DOMAIN}; Path=/; HttpOnly; SameSite=None; Max-Age=${30 * 24 * 60 * 60}; Secure=${envVars.NODE_ENV === "production"}; Expires=${expiresAt.toUTCString()}`
        reply.header("Set-Cookie", cookieValue)

        return reply.code(200).send({
          id: user.id,
          email: user.email,
          emailVerified: Boolean(user.emailVerifiedAt),
          isSuperAdmin: user.isSuperAdmin,
          session: {
            id: session.id,
            expiresAt: session.expiresAt,
          },
        })
      } catch (error) {
        console.error("Login error:", error)
        throw error
      }
    }
  )

  // Logout endpoint
  app.post(
    "/logout",
    {
      schema: {
        description: "Logout current user",
        tags: ["auth"],
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          401: {
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
        // Check for session cookie
        const cookies = request.headers.cookie
        if (!cookies || !cookies.includes("incmix_session_dev=")) {
          return reply.code(401).send({ message: "Unauthorized" })
        }

        // TODO: Validate session and invalidate it
        // For now, return success if cookie exists
        return { message: "Logged out successfully" }
      } catch (error) {
        console.error("Logout error:", error)
        throw error
      }
    }
  )

  // Delete user endpoint
  app.delete(
    "/delete",
    {
      schema: {
        description: "Delete current user account",
        tags: ["auth"],
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          401: {
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
        // Check for session cookie
        const cookies = request.headers.cookie
        if (!cookies || !cookies.includes("incmix_session_dev=")) {
          return reply.code(401).send({ message: "Unauthorized" })
        }

        // TODO: Get user from auth middleware and implement deletion
        return { message: "User deleted successfully" }
      } catch (error) {
        console.error("Delete user error:", error)
        throw error
      }
    }
  )

  // Check email verification endpoint
  app.post(
    "/check-email-verification",
    {
      schema: {
        description: "Check if email is verified",
        tags: ["auth"],
        body: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
          },
          required: ["email"],
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              isEmailVerified: { type: "boolean" },
            },
          },
          404: {
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
        const { email } = request.body as { email: string }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        // TODO: Implement findUserByEmail for Fastify context
        // const user = await findUserByEmail(email)
        // return { isEmailVerified: !!user.emailVerifiedAt }

        return { isEmailVerified: false }
      } catch (error) {
        console.error("Check email verification error:", error)
        return reply.code(404).send({ message: "User not found" })
      }
    }
  )
}
