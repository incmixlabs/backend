import { z } from "@hono/zod-openapi"
import { projectStatus } from "@incmix-api/utils/db-schema"

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

export const CommentSchema = z.object({
  id: z.string().max(100),
  content: z.string().max(2000),
  createdAt: z.string().datetime(),
  createdBy: UserSchema,
})

export type Comment = z.infer<typeof CommentSchema>

export const ProjectMemberSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    avatar: z.string().nullish(),
    role: z.string(),
    isOwner: z.boolean(),
  })
  .openapi({
    example: {
      id: "user123",
      name: "John Doe",
      avatar: "https://example.com/avatar.png",
      role: "member",
      isOwner: false,
    },
  })

export type ProjectMember = z.infer<typeof ProjectMemberSchema>

export const ChecklistSchema = z.object({
  id: z.string().openapi({ example: "2hek2bkjh" }),
  title: z.string().openapi({ example: "Checklist item" }),
  checked: z.boolean().openapi({ example: false }),
  order: z.number().int().nonnegative().openapi({ example: 1 }),
})

export type Checklist = z.infer<typeof ChecklistSchema>

export const ProjectSchema = z.object({
  id: z.string().max(30).openapi({ example: "2hek2bkjh" }),
  name: z.string().openapi({ example: "My Project" }),
  company: z.string().nullish().openapi({ example: "Acme Corp" }),
  logo: z
    .string()
    .nullish()
    .openapi({ example: "https://example.com/logo.png" }),
  description: z.string().nullish().openapi({ example: "Project description" }),
  progress: z.number().int().openapi({ example: 75 }),
  timeLeft: z.string().openapi({ example: "2 weeks" }),
  members: z.array(ProjectMemberSchema),
  orgId: z.string().openapi({ example: "org123" }),
  status: z.enum(projectStatus).openapi({ example: "started" }),
  startDate: z
    .string()
    .datetime()
    .optional()
    .openapi({ example: "2025-01-01T00:00:00Z" }),
  endDate: z
    .string()
    .datetime()
    .optional()
    .openapi({ example: "2025-01-01T00:00:00Z" }),
  budget: z.number().int().nullish().openapi({ example: 10000 }),
  createdAt: z.string().datetime().openapi({ example: "2025-01-01T00:00:00Z" }),
  updatedAt: z.string().datetime().openapi({ example: "2025-01-01T00:00:00Z" }),
  createdBy: UserSchema,
  updatedBy: UserSchema,
})

export type Project = z.infer<typeof ProjectSchema>

// Reference URL schema
export const RefUrlSchema = z.object({
  id: z.string().max(100),
  url: z.string().max(1000),
  title: z.string().max(255).optional(),
  type: z.enum(["figma", "task", "external"]),
  taskId: z.string().max(100).optional(),
})

// Label tag schema
export const LabelTagSchema = z.object({
  value: z.string().max(200),
  label: z.string().max(200),
  color: z.string().max(100),
})

// Attachment schema
export const AttachmentSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(255),
  url: z.string().max(1000),
  size: z.string().max(50),
  type: z.string().max(100).optional(),
})

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
  createdAt: z.string().datetime().openapi({ example: "2025-01-01T00:00:00Z" }),
  updatedAt: z.string().datetime().openapi({ example: "2025-01-01T00:00:00Z" }),
  createdBy: UserSchema,
  updatedBy: UserSchema,
})

export const TaskSchema = z.object({
  id: z.string().max(100),
  projectId: z.string().max(100),
  name: z.string().max(500),
  statusId: z.string().max(100),
  priorityId: z.string().max(100),
  order: z.number().int().min(0).default(0),
  startDate: z
    .string()
    .datetime()
    .nullish()
    .openapi({ example: "2025-01-01T00:00:00Z" }),
  endDate: z
    .string()
    .datetime()
    .nullish()
    .openapi({ example: "2025-01-01T00:00:00Z" }),
  description: z.string().max(2000).default(""),
  acceptanceCriteria: z.array(ChecklistSchema).default([]),
  checklist: z.array(ChecklistSchema).default([]),
  completed: z.boolean().default(false),
  refUrls: z.array(RefUrlSchema).default([]),
  labelsTags: z.array(LabelTagSchema).default([]),
  attachments: z.array(AttachmentSchema).default([]),
  assignedTo: z.array(UserSchema).default([]),
  subTasks: z.array(SubTaskSchema).default([]),
  createdAt: z.string().datetime().openapi({ example: "2025-01-01T00:00:00Z" }),
  updatedAt: z.string().datetime().openapi({ example: "2025-01-01T00:00:00Z" }),
  createdBy: UserSchema,
  updatedBy: UserSchema,
})

export type Task = z.infer<typeof TaskSchema>
