import type { Generated, Insertable, Selectable, Updateable } from "kysely"
import type { Timestamps } from "./custom-types"

export const emailTemplateNames = [
  "VerificationEmail",
  "ResetPasswordEmail",
] as const

export type EmailTemplateName = (typeof emailTemplateNames)[number]
export type Status = "failed" | "pending" | "delivered"

type EmailQueueTable = {
  id: Generated<number>
  recipient: string
  template: EmailTemplateName
  payload: string
  status: Status
  sgId: string | null
  sendgridData: string | null
  shouldRetry: boolean
  timestamps: Timestamps
}

export type EmailQueue = Selectable<EmailQueueTable>
export type NewEmailQueue = Insertable<EmailQueueTable>
export type EmailQueueUpdate = Updateable<EmailQueueTable>

export type EmailTables = {
  emailQueue: EmailQueueTable
}
