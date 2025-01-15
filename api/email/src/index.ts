import { BASE_PATH } from "@/lib/constants"

import { OpenAPIHono } from "@hono/zod-openapi"

import { KVStore } from "@incmix-api/utils/kv-store"
import { setupKvStore } from "@incmix-api/utils/middleware"
import type { EmailQueueRow } from "./dbSchema"
import { sendEmail } from "./lib/helper"
import { middlewares } from "./middleware"
import { routes } from "./routes"
import type { Bindings, HonoApp } from "./types"

const app = new OpenAPIHono<HonoApp>()

const globalStore = new KVStore()

setupKvStore(app, BASE_PATH, globalStore)

middlewares(app)
routes(app)
app.get(`${BASE_PATH}/healthcheck`, (c) => {
  try {
    return c.json(
      {
        status: "UP",
      },
      200
    )
  } catch (_error) {
    return c.json(
      {
        status: "DOWN",
      },
      200
    )
  }
})

export default {
  async fetch(request: Request, env: Bindings) {
    return await app.fetch(request, env)
  },
  async scheduled(
    _event: ScheduledEvent,
    env: Bindings,
    _ctx: ExecutionContext
  ): Promise<void> {
    const { results: failedEmails } = await env.DB.prepare(
      "select * from email_queue where status = ? and should_retry = ?"
    )
      .bind("failed", true)
      .all<EmailQueueRow>()

    if (failedEmails.length) {
      for (const email of failedEmails) {
        const payload = JSON.parse(email.payload)
        const body = {
          template: email.template,
          payload,
        }

        const res = await sendEmail(env.SENDGRID_API_KEY, {
          recipient: email.recipient,
          body,
        })
        if (res.status === 200) {
          await env.DB.prepare(
            "update email_queue set status = ?, sg_id = ?, should_retry = ? where id = ?"
          )
            .bind("pending", res.id, false, email.id)
            .run()
        }
      }
    }
  },
}
