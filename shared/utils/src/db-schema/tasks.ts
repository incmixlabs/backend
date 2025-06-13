import type {
  ChecklistStatus,
  ProjectStatus,
  TaskStatus,
} from "@incmix/utils/types"
import type { ColumnType, Insertable, Selectable, Updateable } from "kysely"

type TasksTable = {
  id: string
  title: string
  content: string
  taskOrder: number
  figmaLink: string | null
  codeSnippets: string[] | null
  status: TaskStatus
  projectId: string
  columnId: string | null
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

type ProjectChecklistsTable = {
  id: string
  projectId: string
  title: string
  createdBy: ColumnType<string, string, never>
  updatedBy: ColumnType<string, string, string>
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, string>
  status: ChecklistStatus
}

type TaskChecklistsTable = {
  id: string
  taskId: string
  title: string
  createdBy: ColumnType<string, string, never>
  updatedBy: ColumnType<string, string, string>
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, string>
  status: ChecklistStatus
}

type CommentsTable = {
  id: string
  content: string
  userId: string
  createdBy: ColumnType<string, string, never>
  updatedBy: ColumnType<string, string, string>
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, string>
}

type ProjectCommentsTable = {
  projectId: string
  commentId: string
}

type TaskCommentsTable = {
  taskId: string
  commentId: string
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

export type ProjectChecklist = Selectable<ProjectChecklistsTable>
export type NewProjectChecklist = Insertable<ProjectChecklistsTable>
export type UpdatedProjectChecklist = Updateable<ProjectChecklistsTable>

export type TaskChecklist = Selectable<TaskChecklistsTable>
export type NewTaskChecklist = Insertable<TaskChecklistsTable>
export type UpdatedTaskChecklist = Updateable<TaskChecklistsTable>

export type Comment = Selectable<CommentsTable>
export type NewComment = Insertable<CommentsTable>
export type UpdatedComment = Updateable<CommentsTable>

export type ProjectComment = Selectable<ProjectCommentsTable>
export type NewProjectComment = Insertable<ProjectCommentsTable>
export type UpdatedProjectComment = Updateable<ProjectCommentsTable>

export type TaskComment = Selectable<TaskCommentsTable>
export type NewTaskComment = Insertable<TaskCommentsTable>
export type UpdatedTaskComment = Updateable<TaskCommentsTable>

export const tables = [
  "projects",
  "columns",
  "tasks",
  "projectMembers",
  "projectChecklists",
  "taskChecklists",
  "comments",
  "projectComments",
  "taskComments",
]

export type TasksTables = {
  tasks: TasksTable
  columns: ColumnsTable
  projects: ProjectsTable
  projectMembers: ProjectMembersTable
  projectChecklists: ProjectChecklistsTable
  taskChecklists: TaskChecklistsTable
  comments: CommentsTable
  projectComments: ProjectCommentsTable
  taskComments: TaskCommentsTable
}
