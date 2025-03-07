import type { Generated, Insertable, Selectable, Updateable } from "kysely"
import type { EmailTemplateName } from "./types"

export type Status = "failed" | "pending" | "delivered"
type EmailQueueTable = {
  id: Generated<number>
  recipient: string
  template: EmailTemplateName
  payload: string
  status: "failed" | "pending" | "delivered"
  sgId?: string
  shouldRetry: boolean
}

export type Database = {
  emailQueue: EmailQueueTable
}

export type EmailQueue = Selectable<EmailQueueTable>
export type NewEmailQueue = Insertable<EmailQueueTable>
export type EmailQueueUpdate = Updateable<EmailQueueTable>
