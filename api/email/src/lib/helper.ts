import type { RequestSchema } from "@/routes/email/types"
import { emailTemplateMap } from "@/types"
import { render } from "@react-email/components"
import type { StatusCode } from "hono/utils/http-status"
import type { z } from "zod"
import { emailSender } from "./utils"

export async function sendEmail(
  SENDGRID_API_KEY: string,
  params: z.infer<typeof RequestSchema>
): Promise<{ message: string; id?: string; status: StatusCode }> {
  const { recipient, body } = params

  let id: string | undefined = ""
  if (body.template === "VerificationEmail") {
    const { verificationLink } = body.payload
    const template = await render(
      emailTemplateMap.VerificationEmail({
        verificationLink,
      })
    )
    const res = await emailSender.send(
      SENDGRID_API_KEY,
      recipient,
      "Verify Email",
      template
    )

    if (res.status !== 202) {
      return {
        message: "Failed to send Email",
        status: 500,
      }
    }
    id = res.headers.get("X-Message-ID") ?? undefined
  } else if (body.template === "ResetPasswordEmail") {
    const { resetPasswordLink, username } = body.payload
    const template = await render(
      emailTemplateMap.ResetPasswordEmail({
        resetPasswordLink,
        username,
      })
    )
    const res = await emailSender.send(
      SENDGRID_API_KEY,
      recipient,
      "Reset Password",
      template
    )

    if (res.status !== 202) {
      return { message: "Failed to send Email", status: 500 }
    }
    id = res.headers.get("X-Message-ID") ?? undefined
  }

  return { message: "Email Sent", id, status: 200 }
}
