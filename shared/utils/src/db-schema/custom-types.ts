import type { ColumnType } from "kysely"

export type CreatedByUpdatedBy = {
  createdBy: string
  updatedBy: string
}

export type Timestamps = {
  createdAt: Date
  updatedAt: Date
}

export type Timeline = {
  startDate: Date
  endDate: Date
}

export type Checklist = {
  done: boolean
  item: string
}

export const projectStatusEnum = [
  "todo",
  "started",
  "on_hold",
  "cancelled",
  "completed",
  "archived",
] as const
export type ProjectStatus = (typeof projectStatusEnum)[number]

export const taskStatusEnum = [
  "backlog",
  "active",
  "on_hold",
  "cancelled",
  "archived",
] as const
export type TaskStatus = (typeof taskStatusEnum)[number]
