import type { EmailTemplateName } from "./types"

export type EmailQueueRow = {
  id: number
  recipient: string
  template: EmailTemplateName
  payload: string
  status: "failed" | "pending" | "delivered"
  sg_id?: string
  should_retry: number
}
