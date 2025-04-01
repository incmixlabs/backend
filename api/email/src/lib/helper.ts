import type { RequestSchema } from "@/routes/email/types"
import { emailTemplateMap } from "@/types"
import { render } from "@react-email/render"
import type { StatusCode } from "hono/utils/http-status"
import type { z } from "zod"
import { emailSender } from "./utils"
export type SendEmailReponse = {
  message: string
  id?: string
  status: StatusCode
  title?: string
  type?: string
}
export async function sendEmail(
  SENDGRID_API_KEY: string,
  params: z.infer<typeof RequestSchema>
): Promise<SendEmailReponse> {
  const { recipient, body } = params

  let id: string | undefined = ""
  const type = body.template
  let title = ""
  let template = ""
  switch (type) {
    case "VerificationEmail": {
      const { verificationLink } = body.payload
      template = await render(
        emailTemplateMap.VerificationEmail({
          verificationLink,
        })
      )
      title = "Verify Email"
      break
    }
    case "ResetPasswordEmail": {
      const { resetPasswordLink, username } = body.payload
      template = await render(
        emailTemplateMap.ResetPasswordEmail({
          resetPasswordLink,
          username,
        })
      )
      title = "Reset Password"
      break
    }
    default:
      break
  }
  if (!template) {
    return {
      message: "Invalid template",
      status: 400,
      type,
      title,
    }
  }
  /* apiKey: string
  to: string
  subject: string
  html: string*/
  const res = await emailSender.send({
    apiKey: SENDGRID_API_KEY,
    to: recipient,
    subject: title,
    html: template,
  })

  if (res.status !== 202) {
    return {
      message: "Failed to send Email",
      type,
      title,
      status: 500,
    }
  }
  id = res.headers.get("X-Message-ID") ?? undefined

  return { message: "Email Sent", id, status: 200 }
}
