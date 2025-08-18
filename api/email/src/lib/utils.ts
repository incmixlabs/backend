import { ServerError } from "@incmix-api/utils/errors"
import { Resend } from "resend"
import { envVars } from "../env-vars"

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
      from: envVars.EMAIL_FROM,
      to: [to],
      subject,
      html,
    })
    if (result.error) throw new ServerError(result.error.message)

    return {
      status: 200,
      id: result.data?.id,
      ok: true,
    }
  },
}
