import { emailTemplateMap } from "@/types"
import { emailSender } from "./utils"

export type SendEmailResponse = {
  message: string
  id?: string
  status: number
  title?: string
  type?: string
}

type VerificationBody = {
  template: "VerificationEmail"
  payload: { verificationLink: string }
}
type ResetPasswordBody = {
  template: "ResetPasswordEmail"
  payload: { resetPasswordLink: string; username: string }
}
type EmailParams = {
  recipient: string
  body: VerificationBody | ResetPasswordBody
  requestedBy: string
}

export async function sendEmail(
  params: EmailParams
): Promise<SendEmailResponse> {
  const { recipient, body } = params

  const type = body.template
  let title = ""
  let Template: React.ReactNode | null = null
  switch (type) {
    case "VerificationEmail": {
      const { verificationLink } = body.payload

      Template = emailTemplateMap.VerificationEmail({
        verificationLink,
      })

      title = "Verify Email"
      break
    }
    case "ResetPasswordEmail": {
      const { resetPasswordLink, username } = body.payload
      Template = emailTemplateMap.ResetPasswordEmail({
        resetPasswordLink,
        username,
      })

      title = "Reset Password"
      break
    }
    default:
      break
  }
  if (!Template) {
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
    to: recipient,
    subject: title,
    react: Template,
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
