import type { TaskStatus } from "@incmix/utils/types"
import type { ColumnType, Insertable, Selectable, Updateable } from "kysely"
import type {
  Checklist,
  CreatedByUpdatedBy,
  ProjectStatus,
  Timeline,
  Timestamps,
} from "./custom-types"

type TasksTable = {
  id: string
  title: string
  content: string
  status: TaskStatus
  taskOrder: number
  figmaLink: string
  codeSnippets: string[]
  projectId: string
  columnId: string
  assignedTo: string
  createdByUpdatedBy: ColumnType<CreatedByUpdatedBy>
  timestamps: ColumnType<Timestamps>
  currentTimeline: Timeline
  actualTimeline: Timeline
  checklists: Checklist[]
}

type ColumnsTable = {
  id: string
  label: string
  columnOrder: number
  projectId: string
  parentId: string | null
  createdByUpdatedBy: ColumnType<CreatedByUpdatedBy>
  timestamps: ColumnType<Timestamps>
}

type ProjectsTable = {
  id: string
  name: string
  orgId: string
  createdByUpdatedBy: ColumnType<CreatedByUpdatedBy>
  timestamps: ColumnType<Timestamps>
  status: ProjectStatus
  currentTimeline: Timeline
  actualTimeline: Timeline
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
  createdByUpdatedBy: ColumnType<CreatedByUpdatedBy>
  timestamps: ColumnType<Timestamps>
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
