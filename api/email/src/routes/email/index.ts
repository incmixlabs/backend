import type { Status } from "@incmix-api/utils/db-schema"
import type { FastifyInstance } from "fastify"
import { sendEmail } from "@/lib/helper"
import {
  type EmailRequest,
  MessageResponseSchema,
  RequestSchema,
} from "./types"

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
        const { recipient, requestedBy, body } = request.body as EmailRequest

        const res = await sendEmail({
          recipient,
          requestedBy,
          body,
        })

        let status: Status = "pending"
        let shouldRetry = false
        if (res.status !== 200) {
          status = "failed"
          shouldRetry = res.status >= 500
        }

        if (request.context?.db) {
          try {
            await request.context.db
              .insertInto("emailQueue")
              .values({
                recipient: recipient,
                template: body.template,
                payload: JSON.stringify(body.payload),
                status,
                userId: requestedBy,
                resendId: res.id ?? null,
                shouldRetry,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
              .executeTakeFirstOrThrow()
          } catch (dbErr) {
            request.log?.error?.({ err: dbErr }, "emailQueue insert failed")
            // proceed without failing the original request
          }
        }

        const statusCode =
          res.status === 200 ? 200 : res.status >= 500 ? 500 : 400
        return reply.code(statusCode).send({
          message: res.message,
          status: res.status,
        })
      } catch (error) {
        console.error("Email sending error:", error)
        return reply.code(500).send({
          message: "Internal server error while sending email",
          status: 500,
        })
      }
    }
  )
}
