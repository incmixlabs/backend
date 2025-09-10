import type { FastifyInstance } from "fastify"

export const setupResetPasswordRoutes = async (app: FastifyInstance) => {
  // Request password reset
  app.post(
    "/reset-password/request",
    {
      schema: {
        description: "Request password reset",
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

        // TODO: Send email with reset link
        // await sendResetPasswordEmail(user.email, verificationCode)

        return { message: "If the account exists, we sent a reset email" }
      } catch (error) {
        console.error("Password reset request error:", error)
        throw error
      }
    }
  )

  // Confirm password reset
  app.post(
    "/reset-password/confirm",
    {
      schema: {
        description: "Confirm password reset with token",
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
    "/reset-password",
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
    },
    async (_request, _reply) => {
      try {
        // TODO: Implement authenticated password reset
        return { message: "Password reset successfully" }
      } catch (error) {
        console.error("Reset password error:", error)
        throw error
      }
    }
  )
}
