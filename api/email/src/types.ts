import type { KyselyDb } from "@incmix-api/utils/db-schema"
import VerificationEmail from "./emails/email-verification"
import ResetPasswordEmail from "./emails/reset-password"
import type { Env } from "./env-vars"

export type Bindings = Env

export type Variables = {
  db: KyselyDb
}

export const emailTemplateMap = {
  VerificationEmail: VerificationEmail,
  ResetPasswordEmail: ResetPasswordEmail,
}
