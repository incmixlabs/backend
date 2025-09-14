import { render } from "@react-email/render"
import { emailTemplateMap } from "@/types"
import { emailSender } from "./utils"

export type SendEmailReponse = {
  message: string
  id?: string
  status: number
  title?: string
  type?: string
}

type EmailParams = {
  recipient: string
  body: {
    template: "VerificationEmail" | "ResetPasswordEmail"
    payload: any
  }
  requestedBy: string
}

export async function sendEmail(
  RESEND_API_KEY: string,
  params: EmailParams
): Promise<SendEmailReponse> {
  const { recipient, body } = params

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
    apiKey: RESEND_API_KEY,
    to: recipient,
    subject: title,
    html: template,
  })

  if (res.status !== 200 || !res.id) {
    return {
      message: "Failed to send Email",
      type,
      title,
      status: 500,
    }
  }

  return { message: "Email Sent", id: res.id, status: 200 }
}
