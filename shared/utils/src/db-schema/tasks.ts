import type { TaskStatus } from "@incmix/utils/types"
import type { ColumnType, Insertable, Selectable, Updateable } from "kysely"
import type { Checklist, ProjectStatus } from "./custom-types"

type TasksTable = {
  id: string
  title: string
  content: string
  taskOrder: number
  figmaLink: string | null
  codeSnippets: string[] | null
  status: TaskStatus
  checklists: Checklist[] | null
  projectId: string
  columnId: string
  assignedTo: string | null
  createdBy: ColumnType<string, string, never>
  updatedBy: ColumnType<string, string, string>
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, string>
  currentTimelineStartDate: ColumnType<Date, string, string>
  currentTimelineEndDate: ColumnType<Date, string, string>
  actualTimelineStartDate: ColumnType<Date, string, string>
  actualTimelineEndDate: ColumnType<Date, string, string>
}

type ColumnsTable = {
  id: string
  label: string
  columnOrder: number
  projectId: string
  parentId: string | null
  createdBy: ColumnType<string, string, never>
  updatedBy: ColumnType<string, string, string>
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, string>
}

type ProjectsTable = {
  id: string
  name: string
  orgId: string
  createdBy: ColumnType<string, string, never>
  updatedBy: ColumnType<string, string, string>
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, string>
  status: ProjectStatus
  currentTimelineStartDate: ColumnType<Date, string, string>
  currentTimelineEndDate: ColumnType<Date, string, string>
  actualTimelineStartDate: ColumnType<Date, string, string>
  actualTimelineEndDate: ColumnType<Date, string, string>
  checklists: Checklist[]
  budgetEstimate: number
  budgetActual: number
  description: string
  company: string
  logo: string | null
}

type ProjectMembersTable = {
  projectId: string
  userId: string
  role: string
  isOwner: boolean
  createdBy: ColumnType<string, string, never>
  updatedBy: ColumnType<string, string, string>
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, string>
}

export type Task = Selectable<TasksTable>
export type NewTask = Insertable<TasksTable>
export type UpdatedTask = Updateable<TasksTable>

export type Column = Selectable<ColumnsTable>
export type NewColumn = Insertable<ColumnsTable>
export type UpdatedColumn = Updateable<ColumnsTable>

export type Project = Selectable<ProjectsTable>
export type NewProject = Insertable<ProjectsTable>
export type UpdatedProject = Updateable<ProjectsTable>

export type ProjectMember = Selectable<ProjectMembersTable>
export type NewProjectMember = Insertable<ProjectMembersTable>
export type UpdatedProjectMember = Updateable<ProjectMembersTable>

export const tables = ["projects", "columns", "tasks", "projectMembers"]

export type TasksTables = {
  tasks: TasksTable
  columns: ColumnsTable
  projects: ProjectsTable
  projectMembers: ProjectMembersTable
}
