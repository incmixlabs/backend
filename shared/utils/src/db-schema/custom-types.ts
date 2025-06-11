export type Timeline = {
  startDate: string
  endDate: string
}

export const checklistStatusEnum = ["todo", "in_progress", "done"] as const
export type ChecklistStatus = (typeof checklistStatusEnum)[number]

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
