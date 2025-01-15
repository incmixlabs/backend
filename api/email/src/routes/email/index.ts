import { sendEmail } from "@/lib/helper"
import type { HonoApp } from "@/types"
import { OpenAPIHono, type RouteConfigToTypedResponse } from "@hono/zod-openapi"
import { processError, zodError } from "@incmix-api/utils/errors"
import { sendMail } from "./openapi"
import type { ContentfulStatusCode } from "hono/utils/http-status"

const emailRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

emailRoutes.openapi(sendMail, async (c) => {
  try {
    const params = c.req.valid("json")

    const res = await sendEmail(c.env.SENDGRID_API_KEY, params)

    let status = "pending"
    let shouldRetry = false
    if (res.status !== 200) {
      status = "failed"
      shouldRetry = true
    }

    await c.env.DB.prepare(
      "insert into email_queue (recipient,template,payload,status,sg_id,should_retry) values (?,?,?,?,?,?)"
    )
      .bind(
        params.recipient,
        params.body.template,
        JSON.stringify(params.body.payload),
        status,
        res.id,
        shouldRetry
      )
      .run()

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
