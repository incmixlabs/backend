import type { FastifyInstance } from "fastify"

export const setupEmailVerificationRoutes = async (app: FastifyInstance) => {
  // Send verification email endpoint
  app.post(
    "/verification-email/send",
    {
      schema: {
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

        // TODO: Implement findUserByEmail and verification logic
        // const user = await findUserByEmail(email)
        // if (user.emailVerifiedAt) {
        //   return { message: "Email already verified" }
        // }
        // const verificationCode = await generateVerificationCode(user.id, email, "email_verification")
        // await sendVerificationEmail(email, verificationCode, user.id)

        return { message: "Verification email sent" }
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
    async (request, _reply) => {
      try {
        const { code, email } = request.body as { code: string; email: string }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        // TODO: Implement verification logic
        // const user = await findUserByEmail(email)
        // if (!user) {
        //   return reply.status(404).send({ message: "User not found" })
        // }
        // const validCode = await verifyVerificationCode(user, code, "email_verification")
        // if (!validCode) {
        //   return reply.status(401).send({ message: "Invalid code" })
        // }
        // await invalidateAllSessions(user.id)
        // const session = await createSession(user.id)
        // await updateUserEmailVerified(user.id)

        return { message: "Email verified successfully" }
      } catch (error) {
        console.error("Verify email error:", error)
        throw error
      }
    }
  )
}
