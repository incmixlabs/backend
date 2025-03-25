// import { EmailQueue } from "@/dbSchema"
// import type { HonoApp } from "@/types"
// import { OpenAPIHono } from "@hono/zod-openapi"
// import { EventWebhook, EventWebhookHeader } from "@sendgrid/eventwebhook"

// const webhookRoutes = new OpenAPIHono<HonoApp>()
// webhookRoutes.post("", async (c) => {
//   const body = await c.req.raw.text()
//   const signature = c.req.header(EventWebhookHeader.SIGNATURE())
//   const timestamp = c.req.header(EventWebhookHeader.TIMESTAMP())

//   console.log(c.req, body, signature, timestamp)

//   if (!body.length || !signature || !timestamp)
//     return c.json({ message: "Failed" }, 400)

//   const key = c.env.SENDGRID_WEBHOOK_KEY
//   console.log(key)

//   const webhook = new EventWebhook()
//   const ecPublicKey = webhook.convertPublicKeyToECDSA(key)

//   const valid = webhook.verifySignature(ecPublicKey, body, signature, timestamp)
//   if (!valid) return c.json({ message: "Verification Failed" }, 400)

//   const events = JSON.parse(body)

//   for (const body of events) {
//     const [msgId] = body["sg_message_id"]?.split(".") as string[]

//     if (!msgId) return c.json({ message: "failed" }, 400)
//     if (body["event"] !== "delivered") {
//       await c.env.DB.prepare(
//         "update email_queue set status = ?, should_retry = ?, sendgrid_data = ? where sg_id = ?"
//       )
//         .bind("failed", false, JSON.stringify(body), msgId)
//         .run<EmailQueue>()
//     } else {
//       await c.env.DB.prepare(
//         "update email_queue set status = ?, should_retry = ?, sendgrid_data = ? where sg_id = ?"
//       )
//         .bind("delivered", false, JSON.stringify(body), msgId)
//         .run<EmailQueueRow>()
//     }
//   }
//   return c.json({ message: "success" }, 200)
// })

// export default webhookRoutes
