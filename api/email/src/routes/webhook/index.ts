// import { EmailQueue } from "@/dbSchema"
// import type { HonoApp } from "@/types"
// import { verifyResendWebhookSignature } from "@/lib/webhook-verification"

// const webhookRoutes = new OpenAPIHono<HonoApp>()
// webhookRoutes.post("", async (c) => {
//   const body = await c.req.raw.text()
//   const signature = c.req.header("resend-signature")

//   console.log(c.req, body, signature)

//   if (!body.length || !signature)
//     return c.json({ message: "Failed" }, 400)

//   // Verify Resend webhook signature
//   const webhookSecret = c.env.RESEND_WEBHOOK_SECRET
//   const valid = verifyResendWebhookSignature(body, signature, webhookSecret)
//   if (!valid) return c.json({ message: "Verification Failed" }, 400)

//   const events = JSON.parse(body)

//   for (const event of events) {
//     const messageId = event.data?.id

//     if (!messageId) return c.json({ message: "failed" }, 400)

//     if (event.type !== "email.delivered") {
//       await c.env.DB.prepare(
//         "update email_queue set status = ?, should_retry = ?, resend_data = ? where resend_id = ?"
//       )
//         .bind("failed", false, JSON.stringify(event), messageId)
//         .run<EmailQueue>()
//     } else {
//       await c.env.DB.prepare(
//         "update email_queue set status = ?, should_retry = ?, resend_data = ? where resend_id = ?"
//         .bind("delivered", false, JSON.stringify(event), messageId)
//         .run<EmailQueue>()
//       )
//     }
//   }
//   return c.json({ message: "success" }, 200)
// })

// export default webhookRoutes
