import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely"

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
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, never>
}

export type EmailQueue = Selectable<EmailQueueTable>
export type NewEmailQueue = Insertable<EmailQueueTable>
export type EmailQueueUpdate = Updateable<EmailQueueTable>

export type EmailTables = {
  emailQueue: EmailQueueTable
}
