import type { FastifyInstance } from "fastify"
import { createSession, invalidateAllSessions } from "@/auth/session"
import { sendForgetPasswordEmail } from "@/lib/helper"
import { authMiddleware, setSessionCookie } from "@/middleware/auth"

export const setupResetPasswordRoutes = (app: FastifyInstance) => {
  // Send forget password email
  app.post(
    "/reset-password/request",
    {
      schema: {
        description: "Send forget password email",
        tags: ["password-reset"],
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
          422: {
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

        const db = request.context.db

        // Check if user exists
        const user = await db
          .selectFrom("users")
          .select(["id", "email"])
          .where("email", "=", email)
          .where("isActive", "=", true)
          .executeTakeFirst()

        if (!user) {
          return reply.code(404).send({ message: "User not found" })
        }

        // Generate verification code
        const crypto = await import("node:crypto")
        const verificationCode = crypto.randomBytes(32).toString("hex")
        const codeHash = crypto
          .createHash("sha256")
          .update(verificationCode)
          .digest("hex")
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

        // Delete any existing reset password tokens for this user
        await db
          .deleteFrom("verificationCodes")
          .where("userId", "=", user.id)
          .where("codeType", "=", "reset_password")
          .execute()

        // Store hashed verification code
        await db
          .insertInto("verificationCodes")
          .values({
            userId: user.id,
            code: verificationCode, // Keep for backward compatibility during transition
            codeHash,
            email: user.email,
            codeType: "reset_password",
            expiresAt: expiresAt.toISOString(),
          })
          .execute()

        // Send forget password email
        try {
          await sendForgetPasswordEmail(
            request as any,
            user.email,
            verificationCode,
            user.id
          )
        } catch (emailError) {
          console.error("Failed to send reset password email:", emailError)
          // Don't reveal email sending failures for security
          // Still return success message to prevent email enumeration
        }

        return { message: "If the account exists, we sent a reset email" }
      } catch (error) {
        console.error("Password reset request error:", error)
        throw error
      }
    }
  )

  // Forget password (confirm with token)
  app.post(
    "/reset-password/confirm",
    {
      schema: {
        description: "Forget password confirmation with token",
        tags: ["password-reset"],
        body: {
          type: "object",
          properties: {
            token: { type: "string", minLength: 1 },
            newPassword: { type: "string", minLength: 8, maxLength: 128 },
          },
          required: ["token", "newPassword"],
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
          422: {
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
        const { token, newPassword } = request.body as {
          token: string
          newPassword: string
        }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        const db = request.context.db

        // Hash the provided token to compare with stored hash
        const crypto = await import("node:crypto")
        const tokenHash = crypto
          .createHash("sha256")
          .update(token)
          .digest("hex")

        // Find valid verification code by hash (preferred) or fallback to plain code
        const verificationCode = await db
          .selectFrom("verificationCodes")
          .selectAll()
          .where((eb) =>
            eb.or([
              eb("codeHash", "=", tokenHash),
              eb("code", "=", token), // Fallback for existing tokens without hash
            ])
          )
          .where("codeType", "=", "reset_password")
          .where("expiresAt", ">", new Date())
          .executeTakeFirst()

        if (!verificationCode) {
          return reply
            .code(401)
            .send({ message: "Invalid or expired reset code" })
        }

        // Find user by email from verification code
        const user = await db
          .selectFrom("users")
          .selectAll()
          .where("id", "=", verificationCode.userId)
          .where("isActive", "=", true)
          .executeTakeFirst()

        if (!user) {
          return reply.code(404).send({ message: "User not found" })
        }

        // Hash new password
        const bcrypt = await import("bcrypt")
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update password and invalidate verification code
        await db.transaction().execute(async (tx) => {
          // Update user password
          await tx
            .updateTable("users")
            .set({
              hashedPassword,
            })
            .where("id", "=", user.id)
            .execute()

          // Delete the used verification code
          await tx
            .deleteFrom("verificationCodes")
            .where("code", "=", token)
            .execute()

          // Invalidate all user sessions
          await tx
            .deleteFrom("sessions")
            .where("userId", "=", user.id)
            .execute()
        })

        return { message: "Password reset successfully" }
      } catch (error) {
        console.error("Password reset confirm error:", error)
        throw error
      }
    }
  )

  // Reset password (authenticated user)
  app.post(
    "/reset-password/",
    {
      schema: {
        description: "Reset password for authenticated user",
        tags: ["password-reset"],
        body: {
          type: "object",
          properties: {
            currentPassword: { type: "string" },
            newPassword: { type: "string", minLength: 8, maxLength: 128 },
          },
          required: ["currentPassword", "newPassword"],
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
        },
      },
      preHandler: authMiddleware,
    },
    async (request: any, reply: any) => {
      try {
        const { currentPassword, newPassword } = request.body as {
          currentPassword: string
          newPassword: string
        }

        // Check if user is authenticated
        if (!request.user) {
          return reply.status(401).send({ message: "Unauthorized" })
        }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        const userId = request.user.id
        const db = request.context.db

        // Get current user with password from database
        const user = await db
          .selectFrom("users")
          .select(["id", "hashedPassword", "isActive"])
          .where("id", "=", userId)
          .executeTakeFirst()

        if (!user) {
          return reply.status(404).send({ message: "User not found" })
        }

        if (!user.isActive) {
          return reply
            .status(400)
            .send({ message: "User account is deactivated" })
        }

        // Verify current password
        const bcrypt = await import("bcrypt")
        const isCurrentPasswordValid = await bcrypt.compare(
          currentPassword,
          user.hashedPassword
        )

        if (!isCurrentPasswordValid) {
          return reply
            .status(400)
            .send({ message: "Current password is incorrect" })
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10)

        // Update password and manage sessions in transaction
        await db.transaction().execute(async (tx: any) => {
          // Update user password
          await tx
            .updateTable("users")
            .set({
              hashedPassword: hashedNewPassword,
            })
            .where("id", "=", userId)
            .execute()

          // Invalidate all existing sessions except current one

          // If no current session, invalidate all
          await invalidateAllSessions(tx, userId)
        })

        // Create a new session for security
        const newSession = await createSession(db, userId)

        // Set new session cookie
        setSessionCookie(reply, newSession.id, new Date(newSession.expiresAt))

        return {
          message: "Password reset successfully",
          session: {
            id: newSession.id,
            expiresAt: newSession.expiresAt,
          },
        }
      } catch (error) {
        console.error("Reset password error:", error)
        throw error
      }
    }
  )
}
