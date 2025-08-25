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

const UserSchema = z
  .object({
    id: z.string().max(100).openapi({ example: "user123" }),
    name: z.string().max(200).openapi({ example: "John Doe" }),
    image: z
      .string()
      .max(500)
      .optional()
      .openapi({ example: "https://example.com/avatar.png" }),
  })
  .openapi({
    example: {
      id: "user123",
      name: "John Doe",
      image: "https://example.com/avatar.png",
    },
  })

// this is same for checklis and acceptence criteria
export const ChecklistItemSchema = z
  .object({
    id: z.string().max(100).openapi({ example: "item123" }),
    text: z.string().max(500).openapi({ example: "Checklist item text" }),
    checked: z.boolean().default(false).openapi({ example: false }),
    order: z.number().int().min(0).default(0).openapi({ example: 1 }),
  })
  .openapi({
    example: {
      id: "item123",
      text: "Checklist item text",
      checked: false,
      order: 1,
    },
  })

export const CommentSchema = z
  .object({
    id: z.string().max(100).openapi({ example: "comment123" }),
    content: z.string().max(2000).openapi({ example: "Comment content" }),
    createdAt: z.number().openapi({ example: 1640995200000 }),
    createdBy: UserSchema,
  })
  .openapi({
    example: {
      id: "comment123",
      content: "Comment content",
      createdAt: 1640995200000,
      createdBy: {
        id: "user123",
        name: "John Doe",
        image: "https://example.com/avatar.png",
      },
    },
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
  text: z.string().openapi({ example: "Checklist item" }),
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
  checklist: z.array(ChecklistSchema).default([]),
  acceptanceCriteria: z.array(ChecklistItemSchema).default([]),
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
export const RefUrlSchema = z
  .object({
    id: z.string().max(100).openapi({ example: "ref123" }),
    url: z.string().max(1000).openapi({ example: "https://example.com/figma" }),
    title: z.string().max(255).optional().openapi({ example: "Figma Design" }),
    type: z.enum(["figma", "task", "external"]).openapi({ example: "figma" }),
    taskId: z.string().max(100).optional().openapi({ example: "task123" }),
  })
  .openapi({
    example: {
      id: "ref123",
      url: "https://example.com/figma",
      title: "Figma Design",
      type: "figma",
      taskId: "task123",
    },
  })

// Label tag schema
export const LabelTagSchema = z
  .object({
    value: z.string().max(200).openapi({ example: "high" }),
    label: z.string().max(200).openapi({ example: "High Priority" }),
    color: z.string().max(100).openapi({ example: "#ff0000" }),
  })
  .openapi({
    example: {
      value: "high",
      label: "High Priority",
      color: "#ff0000",
    },
  })

// Attachment schema
export const AttachmentSchema = z
  .object({
    id: z.string().max(100).openapi({ example: "att123" }),
    name: z.string().max(255).openapi({ example: "document.pdf" }),
    url: z
      .string()
      .max(1000)
      .openapi({ example: "https://example.com/document.pdf" }),
    size: z.string().max(50).openapi({ example: "1.2MB" }),
    type: z
      .string()
      .max(100)
      .optional()
      .openapi({ example: "application/pdf" }),
  })
  .openapi({
    example: {
      id: "att123",
      name: "document.pdf",
      url: "https://example.com/document.pdf",
      size: "1.2MB",
      type: "application/pdf",
    },
  })

// Sub-task schema
export const SubTaskSchema = z
  .object({
    id: z.string().max(100).openapi({ example: "subtask123" }),
    name: z.string().max(300).openapi({ example: "Subtask name" }),
    completed: z.boolean().default(false).openapi({ example: false }),
    order: z.number().int().min(0).default(0).openapi({ example: 1 }),
  })
  .openapi({
    example: {
      id: "subtask123",
      name: "Subtask name",
      completed: false,
      order: 1,
    },
  })

// Label schema matching labelSchemaLiteral
export const LabelSchema = z
  .object({
    id: z.string().max(100).openapi({ example: "label123" }),
    projectId: z.string().max(100).openapi({ example: "project123" }),
    type: z.enum(labelTypeEnum).openapi({ example: "status" }),
    name: z.string().max(200).openapi({ example: "In Progress" }),
    color: z.string().max(50).openapi({ example: "#00ff00" }),
    order: z.number().int().min(0).default(0).openapi({ example: 1 }),
    description: z
      .string()
      .max(500)
      .default("")
      .openapi({ example: "Task is in progress" }),
    createdAt: z.number().openapi({ example: 1640995200000 }),
    updatedAt: z.number().openapi({ example: 1640995200000 }),
    createdBy: UserSchema,
    updatedBy: UserSchema,
  })
  .openapi({
    example: {
      id: "label123",
      projectId: "project123",
      type: "status",
      name: "In Progress",
      color: "#00ff00",
      order: 1,
      description: "Task is in progress",
      createdAt: 1640995200000,
      updatedAt: 1640995200000,
      createdBy: {
        id: "user123",
        name: "John Doe",
        image: "https://example.com/avatar.png",
      },
      updatedBy: {
        id: "user123",
        name: "John Doe",
        image: "https://example.com/avatar.png",
      },
    },
  })

export const TaskSchema = z
  .object({
    id: z.string().max(100).openapi({ example: "task123" }),
    projectId: z.string().max(100).openapi({ example: "project123" }),
    name: z.string().max(500).openapi({ example: "Task name" }),
    statusId: z.string().max(100).openapi({ example: "status123" }),
    priorityId: z.string().max(100).openapi({ example: "priority123" }),

    parentTaskId: z
      .string()
      .max(100)
      .nullable()
      .default(null)
      .openapi({ example: null }),
    isSubtask: z.boolean().default(false).openapi({ example: false }),

    taskOrder: z.number().int().min(0).default(0).openapi({ example: 1 }),

    startDate: z.number().optional().openapi({ example: 1640995200000 }),
    endDate: z.number().optional().openapi({ example: 1640995200000 }),

    description: z
      .string()
      .max(2000)
      .default("")
      .openapi({ example: "Task description" }),
    acceptanceCriteria: z.array(ChecklistItemSchema).default([]),
    checklist: z.array(ChecklistItemSchema).default([]),
    completed: z.boolean().default(false).openapi({ example: false }),
    refUrls: z.array(RefUrlSchema).default([]),
    labelsTags: z.array(LabelTagSchema).default([]),
    attachments: z.array(AttachmentSchema).default([]),
    assignedTo: z.array(UserSchema).default([]),

    createdAt: z.number().openapi({ example: 1640995200000 }),
    updatedAt: z.number().openapi({ example: 1640995200000 }),
    createdBy: UserSchema,
    updatedBy: UserSchema,
  })
  .openapi({
    example: {
      id: "task123",
      projectId: "project123",
      name: "Task name",
      statusId: "status123",
      priorityId: "priority123",
      parentTaskId: null,
      isSubtask: false,
      taskOrder: 1,
      startDate: 1640995200000,
      endDate: 1640995200000,
      description: "Task description",
      acceptanceCriteria: [],
      checklist: [],
      completed: false,
      refUrls: [],
      labelsTags: [],
      attachments: [],
      assignedTo: [],
      createdAt: 1640995200000,
      updatedAt: 1640995200000,
      createdBy: {
        id: "user123",
        name: "John Doe",
        image: "https://example.com/avatar.png",
      },
      updatedBy: {
        id: "user123",
        name: "John Doe",
        image: "https://example.com/avatar.png",
      },
    },
  })

export type Task = z.infer<typeof TaskSchema>
