import { createValidator } from "./index"

export const projectStatus = ["all", "started", "on-hold", "completed"] as const
export type ProjectStatus = (typeof projectStatus)[number]

export const taskStatusEnum = [
  "backlog",
  "active",
  "on_hold",
  "cancelled",
  "archived",
] as const
export type TaskStatus = (typeof taskStatusEnum)[number]

export const labelTypeEnum = ["status", "priority"] as const
export type LabelType = (typeof labelTypeEnum)[number]

export const timeTypeEnum = ["day", "days", "week", "month", "year"] as const
export type TimeType = (typeof timeTypeEnum)[number]

export interface User {
  id: string
  name: string
  image?: string
}

export const UserSchema = {
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    name: { type: "string", maxLength: 200 },
    image: { type: "string", maxLength: 500 },
  },
  required: ["id", "name"],
  additionalProperties: false,
}

export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
  order: number
}

export const ChecklistItemSchema = {
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    text: { type: "string", maxLength: 500 },
    checked: { type: "boolean", default: false },
    order: { type: "integer", minimum: 0, default: 0 },
  },
  required: ["id", "text"],
  additionalProperties: false,
}

export interface Comment {
  id: string
  content: string
  createdAt: number
  createdBy: User
}

export const CommentSchema = {
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    content: { type: "string", maxLength: 2000 },
    createdAt: { type: "number" },
    createdBy: UserSchema,
  },
  required: ["id", "content", "createdAt", "createdBy"],
  additionalProperties: false,
}

export interface ProjectMember {
  id: string
  name: string
  avatar?: string | null
  role: string
  isOwner: boolean
}

export const ProjectMemberSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    avatar: { type: ["string", "null"] },
    role: { type: "string" },
    isOwner: { type: "boolean" },
  },
  required: ["id", "name", "role", "isOwner"],
  additionalProperties: false,
}

export interface Project {
  id: string
  name: string
  company?: string | null
  logo?: string | null
  description?: string | null
  progress: number
  timeLeft: string
  members: ProjectMember[]
  orgId: string
  checklist: ChecklistItem[]
  acceptanceCriteria: ChecklistItem[]
  status: ProjectStatus
  startDate?: string
  endDate?: string
  budget?: number | null
  createdAt: string
  updatedAt: string
  createdBy: User
  updatedBy: User
}

export const ProjectSchema = {
  type: "object",
  properties: {
    id: { type: "string", maxLength: 30 },
    name: { type: "string" },
    company: { type: ["string", "null"] },
    logo: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    progress: { type: "integer" },
    timeLeft: { type: "string" },
    members: {
      type: "array",
      items: ProjectMemberSchema,
    },
    orgId: { type: "string" },
    checklist: {
      type: "array",
      items: ChecklistItemSchema,
      default: [],
    },
    acceptanceCriteria: {
      type: "array",
      items: ChecklistItemSchema,
      default: [],
    },
    status: { type: "string", enum: [...projectStatus] },
    startDate: { type: "string", format: "date-time" },
    endDate: { type: "string", format: "date-time" },
    budget: { type: ["integer", "null"] },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    createdBy: UserSchema,
    updatedBy: UserSchema,
  },
  required: [
    "id",
    "name",
    "progress",
    "timeLeft",
    "members",
    "orgId",
    "status",
    "createdAt",
    "updatedAt",
    "createdBy",
    "updatedBy",
  ],
  additionalProperties: false,
}

export interface RefUrl {
  id: string
  url: string
  title?: string
  type: "figma" | "task" | "external"
  taskId?: string
}

export const RefUrlSchema = {
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    url: { type: "string", format: "uri", maxLength: 1000 },
    title: { type: "string", maxLength: 255 },
    type: { type: "string", enum: ["figma", "task", "external"] },
    taskId: { type: "string", maxLength: 100 },
  },
  required: ["id", "url", "type"],
  additionalProperties: false,
  if: {
    properties: { type: { const: "task" } },
  },
  then: {
    required: ["taskId"],
  },
}

export interface LabelTag {
  value: string
  label: string
  color: string
}

export const LabelTagSchema = {
  type: "object",
  properties: {
    value: { type: "string", maxLength: 200 },
    label: { type: "string", maxLength: 200 },
    color: { type: "string", maxLength: 100 },
  },
  required: ["value", "label", "color"],
  additionalProperties: false,
}

export interface Attachment {
  id: string
  name: string
  url: string
  size: string
  type?: string
}

export const AttachmentSchema = {
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    name: { type: "string", maxLength: 255 },
    url: { type: "string", maxLength: 1000 },
    size: { type: "string", maxLength: 50 },
    type: { type: "string", maxLength: 100 },
  },
  required: ["id", "name", "url", "size"],
  additionalProperties: false,
}

export interface SubTask {
  id: string
  name: string
  completed: boolean
  order: number
}

export const SubTaskSchema = {
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    name: { type: "string", maxLength: 300 },
    completed: { type: "boolean", default: false },
    order: { type: "integer", minimum: 0, default: 0 },
  },
  required: ["id", "name"],
  additionalProperties: false,
}

export interface Label {
  id: string
  projectId: string
  type: LabelType
  name: string
  color: string
  order: number
  description: string
  createdAt: number
  updatedAt: number
  createdBy: User
  updatedBy: User
}

export const LabelSchema = {
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    projectId: { type: "string", maxLength: 100 },
    type: { type: "string", enum: [...labelTypeEnum] },
    name: { type: "string", maxLength: 200 },
    color: { type: "string", maxLength: 50 },
    order: { type: "integer", minimum: 0, default: 0 },
    description: { type: "string", maxLength: 500, default: "" },
    createdAt: { type: "number" },
    updatedAt: { type: "number" },
    createdBy: UserSchema,
    updatedBy: UserSchema,
  },
  required: [
    "id",
    "projectId",
    "type",
    "name",
    "color",
    "createdAt",
    "updatedAt",
    "createdBy",
    "updatedBy",
  ],
  additionalProperties: false,
}

export interface Task {
  id: string
  projectId: string
  name: string
  statusId: string
  priorityId: string
  parentTaskId: string | null
  isSubtask: boolean
  taskOrder: number
  startDate?: number
  endDate?: number
  description: string
  acceptanceCriteria: ChecklistItem[]
  checklist: ChecklistItem[]
  completed: boolean
  refUrls: RefUrl[]
  labelsTags: LabelTag[]
  attachments: Attachment[]
  assignedTo: User[]
  createdAt: number
  updatedAt: number
  createdBy: User
  updatedBy: User
}

export const TaskSchema = {
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    projectId: { type: "string", maxLength: 100 },
    name: { type: "string", maxLength: 500 },
    statusId: { type: "string", maxLength: 100 },
    priorityId: { type: "string", maxLength: 100 },
    parentTaskId: { type: ["string", "null"], maxLength: 100, default: null },
    isSubtask: { type: "boolean", default: false },
    taskOrder: { type: "integer", minimum: 0, default: 0 },
    startDate: { type: "number" },
    endDate: { type: "number" },
    description: { type: "string", maxLength: 2000, default: "" },
    acceptanceCriteria: {
      type: "array",
      items: ChecklistItemSchema,
      default: [],
    },
    checklist: {
      type: "array",
      items: ChecklistItemSchema,
      default: [],
    },
    completed: { type: "boolean", default: false },
    refUrls: {
      type: "array",
      items: RefUrlSchema,
      default: [],
    },
    labelsTags: {
      type: "array",
      items: LabelTagSchema,
      default: [],
    },
    attachments: {
      type: "array",
      items: AttachmentSchema,
      default: [],
    },
    assignedTo: {
      type: "array",
      items: UserSchema,
      default: [],
    },
    createdAt: { type: "number" },
    updatedAt: { type: "number" },
    createdBy: UserSchema,
    updatedBy: UserSchema,
  },
  required: [
    "id",
    "projectId",
    "name",
    "statusId",
    "priorityId",
    "createdAt",
    "updatedAt",
    "createdBy",
    "updatedBy",
  ],
  additionalProperties: false,
}

export const ProjectValidator = createValidator(ProjectSchema)
export const TaskValidator = createValidator(TaskSchema)
export const LabelValidator = createValidator(LabelSchema)
export const UserValidator = createValidator(UserSchema)
export const ChecklistItemValidator = createValidator(ChecklistItemSchema)
export const CommentValidator = createValidator(CommentSchema)
export const ProjectMemberValidator = createValidator(ProjectMemberSchema)
export const RefUrlValidator = createValidator(RefUrlSchema)
export const LabelTagValidator = createValidator(LabelTagSchema)
export const AttachmentValidator = createValidator(AttachmentSchema)
export const SubTaskValidator = createValidator(SubTaskSchema)