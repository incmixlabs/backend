import type { FastifyInstance } from "fastify"
import { createSession, invalidateAllSessions } from "@/auth/session"
import { findUserByEmail } from "@/lib/db"
import {
  generateVerificationCode,
  sendVerificationEmail,
  verifyVerificationCode,
} from "@/lib/helper"
import { setSessionCookie } from "@/middleware/auth"

export const setupEmailVerificationRoutes = (app: FastifyInstance) => {
  // Send verification email endpoint
  app.post(
    "/verification-email/send",
    {
      schema: {
        summary: "Send email verification",
        description: "Send email verification",
        tags: ["email-verification"],
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
    async (request, _reply) => {
      try {
        const { email } = request.body as { email: string }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }
        let user: Awaited<ReturnType<typeof findUserByEmail>> | null = null
        try {
          user = await findUserByEmail(request as any, email)
        } catch {
          // Avoid user enumeration
          return {
            message: "If the account exists, a verification email was sent",
          }
        }
        if (user.emailVerifiedAt) {
          return { message: "Email already verified" }
        }
        const verificationCode = await generateVerificationCode(
          request as any,
          user.id,
          email,
          "email_verification",
          request.context.db
        )

        await sendVerificationEmail(request, email, verificationCode, user.id)
        return {
          message: "If the account exists, a verification email was sent",
        }
      } catch (error) {
        console.error("Send verification email error:", error)
        throw error
      }
    }
  )

  // Verify email endpoint
  app.post(
    "/verification-email/verify",
    {
      schema: {
        summary: "Verify email",
        description: "Verify email with code",
        tags: ["email-verification"],
        body: {
          type: "object",
          properties: {
            code: { type: "string", minLength: 1 },
            email: { type: "string", format: "email" },
          },
          required: ["code", "email"],
          additionalProperties: false,
        },
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
        const { code, email } = request.body as { code: string; email: string }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        const db = request.context.db

        // Find user by email
        const user = await db
          .selectFrom("users")
          .selectAll()
          .where("email", "=", email)
          .executeTakeFirst()

        if (!user) {
          return reply.status(404).send({ message: "User not found" })
        }

        // Verify the code
        const validCode = await verifyVerificationCode(
          request as any,
          { id: user.id, email: user.email },
          code,
          "email_verification"
        )

        if (!validCode) {
          return reply
            .status(401)
            .send({ message: "Invalid or expired verification code" })
        }

        // Invalidate all existing sessions
        await invalidateAllSessions(db, user.id)

        // Update user's email verification status
        await db
          .updateTable("users")
          .set({
            emailVerifiedAt: new Date().toISOString(),
          })
          .where("id", "=", user.id)
          .execute()

        // Create new session
        const session = await createSession(db, user.id)

        // Set session cookie
        setSessionCookie(reply, session.id, new Date(session.expiresAt))

        return { message: "Email verified successfully" }
      } catch (error) {
        console.error("Verify email error:", error)
        throw error
      }
    }
  )
}
