import type { TaskStatus } from "@incmix/utils/types"
import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely"

type TasksTable = {
  id: string
  content: string
  status: TaskStatus
  taskOrder: number
  projectId: string
  columnId: string
  assignedTo: string
  createdBy: string
  updatedBy: string
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, string>
}

type ColumnsTable = {
  id: string
  label: string
  columnOrder: number
  projectId: string
  parentId: string | null
  createdBy: string
  updatedBy: string
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, string>
}

type ProjectsTable = {
  id: string
  name: string
  orgId: string
  createdBy: string
  updatedBy: string
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, string>
}

export type Database = {
  tasks: TasksTable
  columns: ColumnsTable
  projects: ProjectsTable
  storyTemplates: StoryTemplatesTable
}

type StoryTemplatesTable = {
  id: Generated<number>
  name: string
  content: string
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, string>
  createdBy: string
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

export type StoryTemplate = Selectable<StoryTemplatesTable>
export type NewStoryTemplate = Insertable<StoryTemplatesTable>
export type UpdatedStoryTemplate = Updateable<StoryTemplatesTable>

export const tables = ["projects", "columns", "tasks", "storyTemplates"]
