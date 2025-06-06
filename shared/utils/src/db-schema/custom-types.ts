import type { ColumnType } from "kysely"

export type CreatedByUpdatedBy = {
  createdBy: string
  updatedBy: string
}

export type Timestamps = {
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, string>
}

export type Timeline = {
  startDate: ColumnType<Date, string, never>
  endDate: ColumnType<Date, string, string>
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
