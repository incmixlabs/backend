import { envVars } from "@/env-vars"
import { sendEmail } from "@/lib/helper"
import type { HonoApp } from "@/types"
import { OpenAPIHono, type RouteConfigToTypedResponse } from "@hono/zod-openapi"
import type { Status } from "@incmix-api/utils/db-schema"
import { processError, zodError } from "@incmix-api/utils/errors"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { sendMail } from "./openapi"

const emailRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

emailRoutes.openapi(sendMail, async (c) => {
  try {
    const params = c.req.valid("json")

    const res = await sendEmail(envVars.RESEND_API_KEY, params)

    let status: Status = "pending"
    let shouldRetry = false
    if (res.status !== 200) {
      status = "failed"
      shouldRetry = res.status >= 500
    }

    await c
      .get("db")
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

    return c.json(
      { message: res.message },
      res.status as ContentfulStatusCode
    ) as RouteConfigToTypedResponse<typeof sendMail>
  } catch (error) {
    return await processError<typeof sendMail>(c, error, [
      "{{ default }}",
      "send-mail",
    ])
  }
})

export default emailRoutes
