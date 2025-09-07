import type { Status } from "@incmix-api/utils/db-schema"
import { processError } from "@incmix-api/utils/errors"
import type { FastifyInstance, FastifyPluginCallback } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { envVars } from "@/env-vars"
import { sendEmail } from "@/lib/helper"
import { RequestSchema } from "./types"

const emailRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _options,
  done
) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.post(
    "/",
    {
      schema: {
        summary: "Send Mail",
        description: "Send Email based on the template provided",
        body: RequestSchema,
      },
    },
    async (request, reply) => {
      try {
        const params = request.body

        const res = await sendEmail(envVars.RESEND_API_KEY, params)

        let status: Status = "pending"
        let shouldRetry = false
        if (res.status !== 200) {
          status = "failed"
          shouldRetry = res.status >= 500
        }

        if (!request.db) {
          throw new Error("Database not available")
        }

        await request.db
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

        return reply.status(res.status).send({ message: res.message })
      } catch (error) {
        return await processError(request, reply, error, [
          "{{ default }}",
          "send-mail",
        ])
      }
    }
  )

  done()
}

export default emailRoutes
