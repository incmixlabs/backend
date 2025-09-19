import { ServerError } from "@incmix-api/utils/errors"
import { Resend } from "resend"
import { envVars } from "../env-vars"

export const emailSender = {
  send: async ({
    to,
    subject,
    react,
  }: {
    to: string
    subject: string
    react: React.ReactNode
  }) => {
    const resend = new Resend(envVars.RESEND_API_KEY as string)

    const result = await resend.emails.send({
      from: envVars.EMAIL_FROM as string,
      to,
      subject,
      react,
    })
    if (result.error) throw new ServerError(result.error.message)

    return {
      status: 200,
      id: result.data?.id,
      ok: true,
    }
  },
}
