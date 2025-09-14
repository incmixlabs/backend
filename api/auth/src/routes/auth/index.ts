import type { FastifyInstance, FastifyReply } from "fastify"
// Use the Fastify-compatible version from middleware instead of cookies
// import { deleteSessionCookie } from "@/auth/cookies"
import {
  invalidateAllSessions,
  invalidateSession,
  validateSession,
} from "@/auth/session"
import { generateRandomId } from "@/auth/utils"
import { findUserByEmail } from "@/lib/db"
import { generateVerificationCode, sendVerificationEmail } from "@/lib/helper"
import { authMiddleware } from "@/middleware/auth"
import { envVars } from "../../env-vars"

// Fastify-compatible version of deleteSessionCookie
function deleteSessionCookie(reply: FastifyReply): void {
  const domain = envVars.DOMAIN
  const isIp = domain ? /^\d{1,3}(\.\d{1,3}){3}$/.test(domain) : false
  const domainPart =
    domain && !/localhost/i.test(domain) && !isIp ? `; Domain=${domain}` : ""
  const secure = envVars.NODE_ENV === "prod" ? "; Secure" : ""

  const cookieValue = `${envVars.COOKIE_NAME}=; Path=/; HttpOnly; SameSite=None; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}${domainPart}`
  reply.header("Set-Cookie", cookieValue)
}

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
    email: {
      type: "string",
      format: "email",
      description: "User's email address",
    },
    password: {
      type: "string",
      minLength: 8,
      maxLength: 128,
      description: "User's password (minimum 8 characters)",
    },
    firstName: {
      type: "string",
      minLength: 1,
      maxLength: 50,
      description: "User's first name",
    },
    lastName: {
      type: "string",
      minLength: 1,
      maxLength: 50,
      description: "User's last name",
    },
    fullName: {
      type: "string",
      minLength: 1,
      maxLength: 100,
      description: "User's full name (first and last name combined)",
    },
  },
  required: ["email", "password", "firstName", "lastName", "fullName"],
  additionalProperties: false,
  examples: [
    {
      email: "john.doe@example.com",
      password: "StrongP@ssw0rd123",
      firstName: "John",
      lastName: "Doe",
      fullName: "John Doe",
    },
  ],
}

export const setupAuthRoutes = (app: FastifyInstance) => {
  // Get current user endpoint
  app.get(
    "/me",
    {
      schema: {
        description: "Get current authenticated user information",
        tags: ["Authentication"],
        response: {
          200: {
            description: "Successfully retrieved user information",
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "User's unique identifier",
              },
              email: {
                type: "string",
                format: "email",
                description: "User's email address",
              },
              fullName: {
                type: "string",
                description: "User's full name",
              },
              emailVerified: {
                type: "boolean",
                description: "Whether the user's email has been verified",
              },
              isSuperAdmin: {
                type: "boolean",
                description: "Whether the user has super admin privileges",
              },
            },
          },
          401: {
            description: "User is not authenticated",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
        },
      },
      preHandler: authMiddleware,
    },
    (request, reply) => {
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
        description: "Validate current user session",
        tags: ["Authentication"],
        response: {
          200: {
            description: "Session is valid",
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "User's unique identifier",
              },
              email: {
                type: "string",
                format: "email",
                description: "User's email address",
              },
              session: {
                type: "object",
                description: "Session information",
                properties: {
                  id: { type: "string" },
                  expiresAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          401: {
            description: "Invalid or expired session",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Get session cookie
        const cookies = request.headers.cookie
        if (!cookies) {
          return reply.status(401).send({ message: "Unauthorized" })
        }

        const cookieName = envVars.COOKIE_NAME
        const sessionId = cookies
          .split("; ")
          .find((row) => row.startsWith(`${cookieName}=`))
          ?.split("=")[1]

        if (!sessionId || !request.context?.db) {
          return reply.status(401).send({ message: "Unauthorized" })
        }

        // Validate session
        const session = await validateSession(request.context.db, sessionId)
        if (!session) {
          return reply.status(401).send({ message: "Unauthorized" })
        }

        // Get user details
        const user = await request.context.db
          .selectFrom("users")
          .select(["id", "email"])
          .where("id", "=", session.userId)
          .executeTakeFirst()

        if (!user) {
          return reply.status(401).send({ message: "Unauthorized" })
        }

        return {
          id: user.id,
          email: user.email,
          session: {
            id: session.id,
            expiresAt: session.expiresAt,
          },
        }
      } catch (error) {
        console.error("Validate session error:", error)
        return reply.status(401).send({ message: "Unauthorized" })
      }
    }
  )

  // Get user by ID or email
  app.get(
    "/user",
    {
      schema: {
        description: "Get user by ID or email",
        tags: ["Users"],
        querystring: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "User's unique identifier",
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
            },
          },
        },
        response: {
          200: {
            description: "Successfully retrieved user information",
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "User's unique identifier",
              },
              fullName: {
                type: "string",
                description: "User's full name",
              },
              email: {
                type: "string",
                format: "email",
                description: "User's email address",
              },
              emailVerified: {
                type: "boolean",
                description: "Whether the user's email has been verified",
              },
              isSuperAdmin: {
                type: "boolean",
                description: "Whether the user has super admin privileges",
              },
            },
          },
          400: {
            description: "Bad request - Missing required query parameter",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
          404: {
            description: "User not found",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
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
        description: "Register a new user account",
        tags: ["Authentication"],
        body: ExtendedRegisterRequestSchema,
        response: {
          201: {
            description: "User successfully registered",
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "User's unique identifier",
              },
              email: {
                type: "string",
                format: "email",
                description: "User's email address",
              },
              name: {
                type: "string",
                description: "User's full name",
              },
              emailVerified: {
                type: "boolean",
                description: "Whether the user's email has been verified",
              },
              isSuperAdmin: {
                type: "boolean",
                description: "Whether the user has super admin privileges",
              },
            },
          },
          409: {
            description: "User already exists with this email",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
          422: {
            description: "Invalid request body",
            type: "object",
            properties: {
              message: { type: "string" },
              validation: { type: "array" },
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
          // Send verification email
          const verificationCode = await generateVerificationCode(
            request as any,
            userId,
            email,
            "email_verification",
            db
          )
          await sendVerificationEmail(
            request as any,
            email,
            verificationCode,
            userId
          )
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
        description: "Authenticate user with email and password",
        tags: ["Authentication"],
        body: {
          type: "object",
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
            },
            password: {
              type: "string",
              minLength: 8,
              maxLength: 128,
              description: "User's password (minimum 8 characters)",
            },
          },
          required: ["email", "password"],
          additionalProperties: false,
          examples: [
            {
              email: "john.doe@example.com",
              password: "StrongP@ssw0rd123",
            },
          ],
        },
        response: {
          200: {
            description: "Successfully authenticated",
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "User's unique identifier",
              },
              email: {
                type: "string",
                format: "email",
                description: "User's email address",
              },
              name: {
                type: "string",
                description: "User's full name",
              },
              emailVerified: {
                type: "boolean",
                description: "Whether the user's email has been verified",
              },
              isSuperAdmin: {
                type: "boolean",
                description: "Whether the user has super admin privileges",
              },
              session: {
                type: "object",
                description: "Session information",
                properties: {
                  id: { type: "string" },
                  expiresAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          401: {
            description: "Invalid credentials provided",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
          422: {
            description: "Invalid request body",
            type: "object",
            properties: {
              message: { type: "string" },
              validation: { type: "array" },
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

        // Find user by email with profile
        const user = await db
          .selectFrom("users")
          .innerJoin("userProfiles", "users.id", "userProfiles.id")
          .select([
            "users.id",
            "users.email",
            "users.hashedPassword",
            "users.emailVerifiedAt",
            "users.isSuperAdmin",
            "users.isActive",
            "userProfiles.fullName",
          ])
          .where("users.email", "=", email)
          .where("users.isActive", "=", true)
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
        const cookieValue = `${cookieName}=${sessionId}; Domain=${envVars.DOMAIN}; Path=/; HttpOnly; SameSite=None; Max-Age=${30 * 24 * 60 * 60}; Secure=${envVars.NODE_ENV === "prod"}; Expires=${expiresAt.toUTCString()}`
        reply.header("Set-Cookie", cookieValue)

        return reply.code(200).send({
          id: user.id,
          email: user.email,
          name: user.fullName,
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
        description: "Logout current authenticated user",
        tags: ["Authentication"],
        response: {
          200: {
            description: "Successfully logged out",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
          401: {
            description: "User not authenticated",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
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

        // Get session ID from cookie
        const cookieName = envVars.COOKIE_NAME
        const sessionId = cookies
          .split("; ")
          .find((row) => row.startsWith(`${cookieName}=`))
          ?.split("=")[1]

        if (!sessionId || !request.context?.db) {
          return reply.code(401).send({ message: "Unauthorized" })
        }

        // Invalidate session
        await invalidateSession(request.context.db, sessionId)

        // Delete session cookie
        deleteSessionCookie(reply)

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
        description: "Delete current user account permanently",
        tags: ["Authentication"],
        response: {
          200: {
            description: "User account successfully deleted",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
          401: {
            description: "User not authenticated",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
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

        // Get session ID from cookie
        const cookieName = envVars.COOKIE_NAME
        const sessionId = cookies
          .split("; ")
          .find((row) => row.startsWith(`${cookieName}=`))
          ?.split("=")[1]

        if (!sessionId || !request.context?.db) {
          return reply.code(401).send({ message: "Unauthorized" })
        }

        // Validate session and get user
        const session = await validateSession(request.context.db, sessionId)
        if (!session) {
          return reply.code(401).send({ message: "Unauthorized" })
        }

        const userId = session.userId
        const db = request.context.db

        // Delete user data in transaction
        await db.transaction().execute(async (tx) => {
          // Delete user profile
          await tx.deleteFrom("userProfiles").where("id", "=", userId).execute()

          // Invalidate all user sessions
          await invalidateAllSessions(tx, userId)

          // Delete user
          await tx.deleteFrom("users").where("id", "=", userId).execute()
        })

        // Delete session cookie
        deleteSessionCookie(reply)

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
        description: "Check if user email is verified",
        tags: ["Users"],
        body: {
          type: "object",
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User's email address to check verification status",
            },
          },
          required: ["email"],
          additionalProperties: false,
        },
        response: {
          200: {
            description: "Email verification status retrieved",
            type: "object",
            properties: {
              isEmailVerified: {
                type: "boolean",
                description: "Whether the user's email has been verified",
              },
            },
          },
          404: {
            description: "User not found",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
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

        const user = await findUserByEmail(request as any, email)
        return { isEmailVerified: !!user.emailVerifiedAt }
      } catch (error) {
        console.error("Check email verification error:", error)
        return reply.code(404).send({ message: "User not found" })
      }
    }
  )
}
