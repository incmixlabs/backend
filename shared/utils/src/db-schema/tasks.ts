import type { CHECKLIST, DATE, ID, TaskData } from "@incmix/utils/schema"

import type {
  ColumnType,
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable,
} from "kysely"

type TasksTable = TaskData
type TaskAssignmentsTable = {
  taskId: string
  userId: string
}
type LabelType = "priority" | "status" | "custom"
type LabelsTable = {
  id: string
  projectId: string
  type: LabelType
  name: string
  color: string
  order: number
  description: string
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, string>
  createdBy: string
  updatedBy: string
}
export const projectStatus = ["all", "started", "on-hold", "completed"] as const

export type ProjectStatus = (typeof projectStatus)[number]

type ProjectsTable = {
  id: string
  name: string
  orgId: string
  status: ProjectStatus
  startDate: ColumnType<Date, string, string> | null
  endDate: ColumnType<Date, string, string> | null
  budget: number | null
  description: string | null
  company: string | null
  logo: string | null
  checklist: JSONColumnType<CHECKLIST[]>
  acceptanceCriteria: JSONColumnType<CHECKLIST[]>
  createdAt: ColumnType<DATE, never>
  updatedAt: ColumnType<DATE, never>
  createdBy: ID
  updatedBy: ID
}
type ProjectMembersTable = {
  projectId: ID
  userId: ID
  role: string
  roleId: number
  isOwner: boolean
  createdBy: ColumnType<string, string, never>
  updatedBy: ColumnType<string, string, string>
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, string>
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

export type Label = Selectable<LabelsTable>
export type NewLabel = Insertable<LabelsTable>
export type UpdatedLabel = Updateable<LabelsTable>

export type Project = Selectable<ProjectsTable>
export type NewProject = Insertable<ProjectsTable>
export type UpdatedProject = Updateable<ProjectsTable>

export type ProjectMember = Selectable<ProjectMembersTable>
export type NewProjectMember = Insertable<ProjectMembersTable>
export type UpdatedProjectMember = Updateable<ProjectMembersTable>

export type Comment = Selectable<CommentsTable>
export type NewComment = Insertable<CommentsTable>
export type UpdatedComment = Updateable<CommentsTable>

export type ProjectComment = Selectable<ProjectCommentsTable>
export type NewProjectComment = Insertable<ProjectCommentsTable>
export type UpdatedProjectComment = Updateable<ProjectCommentsTable>

export type TaskComment = Selectable<TaskCommentsTable>
export type NewTaskComment = Insertable<TaskCommentsTable>
export type UpdatedTaskComment = Updateable<TaskCommentsTable>

export type TaskAssignment = Selectable<TaskAssignmentsTable>
export type NewTaskAssignment = Insertable<TaskAssignmentsTable>
export type UpdatedTaskAssignment = Updateable<TaskAssignmentsTable>

export type TasksTables = {
  tasks: TasksTable
  labels: LabelsTable
  projects: ProjectsTable
  projectMembers: ProjectMembersTable
  comments: CommentsTable
  projectComments: ProjectCommentsTable
  taskComments: TaskCommentsTable
  taskAssignments: TaskAssignmentsTable
}
