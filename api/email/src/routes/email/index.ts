import type { Status } from "@/dbSchema"
import { envVars } from "@/env-vars"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/helper"
import type { HonoApp } from "@/types"
import { OpenAPIHono, type RouteConfigToTypedResponse } from "@hono/zod-openapi"
import { processError, zodError } from "@incmix-api/utils/errors"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { sendMail } from "./openapi"
const emailRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

emailRoutes.openapi(sendMail, async (c) => {
  try {
    const params = c.req.valid("json")

    const res = await sendEmail(envVars.SENDGRID_API_KEY, params)

    let status: Status = "pending"
    let shouldRetry = false
    if (res.status !== 200) {
      status = "failed"
      shouldRetry = true
    }

    await db
      .insertInto("emailQueue")
      .values({
        recipient: params.recipient,
        template: params.body.template,
        payload: JSON.stringify(params.body.payload),
        status,
        sgId: res.id,
        shouldRetry,
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
