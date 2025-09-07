import type { FastifyInstance, FastifyPluginCallback } from "fastify"

const resetPasswordRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _options,
  done
) => {
  // Request password reset email
  fastify.post("/send", (request, reply) => {
    try {
      const body = request.body as any
      // Mock different responses based on email for testing
      if (body.email?.includes("nonexistent")) {
        return reply.code(404).send({ message: "User not found" })
      }
      if (body.email && !body.email.includes("@")) {
        return reply.code(422).send({ message: "Invalid email format" })
      }

      return reply.code(200).send({
        message: "Password reset email sent successfully",
      })
    } catch (_error) {
      return reply.code(500).send({ message: "Internal server error" })
    }
  })

  // Reset password with code
  fastify.post("/forget", (request, reply) => {
    try {
      const body = request.body as any

      // Mock different responses for testing
      if (body.code === "invalid-code") {
        return reply.code(401).send({ message: "Invalid reset code" })
      }
      if (body.newPassword && body.newPassword.length < 8) {
        return reply.code(422).send({ message: "Password too weak" })
      }
      if (body.email?.includes("nonexistent")) {
        return reply.code(404).send({ message: "User not found" })
      }

      return reply.code(200).send({
        message: "Password reset successful",
      })
    } catch (_error) {
      return reply.code(500).send({ message: "Internal server error" })
    }
  })
  done()
}

export default resetPasswordRoutes
