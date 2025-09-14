import type { Status } from "@incmix-api/utils/db-schema"
import type { FastifyInstance } from "fastify"
import { envVars } from "@/env-vars"
import { sendEmail } from "@/lib/helper"
import { MessageResponseSchema, RequestSchema } from "./types"

export const setupEmailRoutes = (app: FastifyInstance) => {
  app.post(
    "/",
    {
      schema: {
        description: "Send Email based on the template provided",
        tags: ["email"],
        body: RequestSchema,
        response: {
          200: MessageResponseSchema,
          400: MessageResponseSchema,
          500: MessageResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const params = request.body as any

        const res = await sendEmail(envVars.RESEND_API_KEY as string, params)

        let status: Status = "pending"
        let shouldRetry = false
        if (res.status !== 200) {
          status = "failed"
          shouldRetry = res.status >= 500
        }

        if (request.context?.db) {
          await request.context.db
            .insertInto("emailQueue")
            .values({
              recipient: params.recipient,
              template: params.body.template,
              payload: JSON.stringify(params.body.payload),
              status,
              userId: params.requestedBy,
              resendId: res.id ?? null,
              shouldRetry,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .execute()
        }

        const statusCode =
          res.status === 200 ? 200 : res.status >= 500 ? 500 : 400
        return reply.code(statusCode).send({ message: res.message })
      } catch (error) {
        console.error("Email sending error:", error)
        return reply.code(500).send({
          message: "Internal server error while sending email",
        })
      }
    }
  )
}
