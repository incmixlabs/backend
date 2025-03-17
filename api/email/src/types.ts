import type { Context as HonoContext } from "hono"
import VerificationEmail from "./emails/email-verification"
import ResetPasswordEmail from "./emails/reset-password"

export type Bindings = {
  SENDGRID_API_KEY: string
  SENDGRID_WEBHOOK_KEY: string
}
type Variables = {}

export type HonoApp = { Bindings: Bindings; Variables: Variables }
export type Context = HonoContext<HonoApp>

export const emailTemplateMap = {
  VerificationEmail: VerificationEmail,
  ResetPasswordEmail: ResetPasswordEmail,
}

export const emailTemplateNames = [
  "VerificationEmail",
  "ResetPasswordEmail",
] as const

export type EmailTemplateName = (typeof emailTemplateNames)[number]
