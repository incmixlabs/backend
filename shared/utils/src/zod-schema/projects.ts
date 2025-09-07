import { z } from "zod"

export const projectStatus = ["started", "on-hold", "completed"] as const

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

const UserSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(200),
  image: z.string().max(500).optional(),
})

// this is same for checklis and acceptence criteria
export const ChecklistItemSchema = z.object({
  id: z.string().max(100),
  text: z.string().max(500),
  checked: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
})

export const CommentSchema = z.object({
  id: z.string().max(100),
  content: z.string().max(2000),
  createdAt: z.number(),
  createdBy: UserSchema,
})

export type Comment = z.infer<typeof CommentSchema>

export const ProjectMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().nullish(),
  role: z.string(),
  isOwner: z.boolean(),
})

export type ProjectMember = z.infer<typeof ProjectMemberSchema>

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>

export const ProjectSchema = z.object({
  id: z.string().max(30),
  name: z.string(),
  company: z.string().nullish(),
  logo: z.string().nullish(),
  description: z.string().nullish(),
  progress: z.number().int(),
  timeLeft: z.string(),
  members: z.array(ProjectMemberSchema),
  orgId: z.string(),
  checklist: z.array(ChecklistItemSchema).default([]),
  acceptanceCriteria: z.array(ChecklistItemSchema).default([]),
  status: z.enum(projectStatus),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().int().nullish(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: UserSchema,
  updatedBy: UserSchema,
})

export type Project = z.infer<typeof ProjectSchema>

// Reference URL schema
export const RefUrlSchema = z
  .object({
    id: z.string().max(100),
    url: z.url().max(1000),
    title: z.string().max(255).optional(),
    type: z.enum(["figma", "task", "external"]),
    taskId: z.string().max(100).optional(),
  })
  .superRefine((obj, ctx) => {
    if (obj.type === "task" && !obj.taskId) {
      ctx.addIssue({
        path: ["taskId"],
        message: 'taskId is required when type is "task"',
        code: "invalid_type",
        expected: "string",
        received: "undefined",
      })
    }
  })

export type RefUrl = z.infer<typeof RefUrlSchema>

// Label tag schema
export const LabelTagSchema = z.object({
  value: z.string().max(200),
  label: z.string().max(200),
  color: z.string().max(100),
})

export type LabelTag = z.infer<typeof LabelTagSchema>

// Attachment schema
export const AttachmentSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(255),
  url: z.string().max(1000),
  size: z.string().max(50),
  type: z.string().max(100).optional(),
})

export type Attachment = z.infer<typeof AttachmentSchema>

// Sub-task schema
export const SubTaskSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(300),
  completed: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
})

// Label schema matching labelSchemaLiteral
export const LabelSchema = z.object({
  id: z.string().max(100),
  projectId: z.string().max(100),
  type: z.enum(labelTypeEnum),
  name: z.string().max(200),
  color: z.string().max(50),
  order: z.number().int().min(0).default(0),
  description: z.string().max(500).default(""),
  createdAt: z.number(),
  updatedAt: z.number(),
  createdBy: UserSchema,
  updatedBy: UserSchema,
})

export type Label = z.infer<typeof LabelSchema>

export const TaskSchema = z.object({
  id: z.string().max(100),
  projectId: z.string().max(100),
  name: z.string().max(500),
  statusId: z.string().max(100),
  priorityId: z.string().max(100),

  parentTaskId: z.string().max(100).nullable().default(null),
  isSubtask: z.boolean().default(false),

  taskOrder: z.number().int().min(0).default(0),

  startDate: z.number().optional(),
  endDate: z.number().optional(),

  description: z.string().max(2000).default(""),
  acceptanceCriteria: z.array(ChecklistItemSchema).default([]),
  checklist: z.array(ChecklistItemSchema).default([]),
  completed: z.boolean().default(false),
  refUrls: z.array(RefUrlSchema).default([]),
  labelsTags: z.array(LabelTagSchema).default([]),
  attachments: z.array(AttachmentSchema).default([]),
  assignedTo: z.array(UserSchema).default([]),

  createdAt: z.number(),
  updatedAt: z.number(),
  createdBy: UserSchema,
  updatedBy: UserSchema,
})

export type Task = z.infer<typeof TaskSchema>
