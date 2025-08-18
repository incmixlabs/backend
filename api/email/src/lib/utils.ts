import { ServerError } from "@incmix-api/utils/errors"
import { Resend } from "resend"

export type EmailSender = {
  apiKey: string
  to: string
  subject: string
  html: string
}

export const emailSender = {
  send: async ({ apiKey, to, subject, html }: EmailSender) => {
    const resend = new Resend(apiKey)

    const result = await resend.emails.send({
      from: "Incmix <no-reply@incmix.com>",
      to: [to],
      subject,
      html,
    })
    if (result.error) throw new ServerError(result.error.message)

    // Return a response object that matches the expected interface
    return {
      status: 200, // Resend returns 202 on success
      id: result.data?.id,
      ok: true,
    }
  },
}
