import { z } from "@hono/zod-openapi"
import { projectStatusEnum } from "@incmix-api/utils/db-schema"
import { ColumnSchema } from "@incmix/utils/types"

export const ProjectMemberSchema = z.object({
  id: z.string().openapi({ example: "2hek2bkjh" }),
  name: z.string().openapi({ example: "John Doe" }),
  avatar: z
    .string()
    .nullish()
    .openapi({ example: "https://example.com/avatar.png" }),
  role: z.string().openapi({ example: "Admin" }),
  isOwner: z.boolean().openapi({ example: true }),
})

export const ProjectTimelineSchema = z.object({
  startDate: z
    .date()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
  endDate: z.date().openapi({ example: new Date("2025-01-01").toISOString() }),
})

export const ProjectChecklistSchema = z.object({
  item: z.string().openapi({ example: "Checklist Item" }),
  done: z.boolean().openapi({ example: true }),
})

export const ProjectSchema = z.object({
  id: z.string().openapi({ example: "2hek2bkjh" }),
  orgId: z.string().openapi({ example: "2hek2bkjh" }),
  name: z.string().openapi({ example: "Project Name" }),
  company: z.string().openapi({ example: "Company Name" }),
  logo: z
    .string()
    .nullish()
    .openapi({ example: "https://example.com/logo.png" }),
  description: z.string().openapi({ example: "Project Description" }),
  progress: z.number().openapi({ example: 50 }),
  members: z.array(ProjectMemberSchema),
  status: z.enum(projectStatusEnum).openapi({ example: "todo" }),
  currentTimeline: ProjectTimelineSchema,
  actualTimeline: ProjectTimelineSchema,
  budgetEstimate: z.number().openapi({ example: 100000 }),
  budgetActual: z.number().nullish().openapi({ example: 100000 }),
  checklists: z.array(ProjectChecklistSchema),
  createdByUpdatedBy: z.object({
    createdBy: z.string().openapi({ example: "2hek2bkjh" }),
    updatedBy: z.string().openapi({ example: "2hek2bkjh" }),
  }),
  timestamps: z.object({
    createdAt: z
      .date()
      .openapi({ example: new Date("2025-01-01").toISOString() }),
    updatedAt: z
      .date()
      .openapi({ example: new Date("2025-01-01").toISOString() }),
  }),
})

export const ProjectIdSchema = z.object({
  projectId: z.string().openapi({ example: "2hek2bkjh" }),
})
export const ColumnIdSchema = z.object({
  columnId: z.string().optional().openapi({ example: "2hek2bkjh" }),
})
export const OrgIdSchema = z.object({
  orgId: z.string().openapi({ example: "2hek2bkjh" }),
})

export const CreateProjectSchema = ProjectSchema.omit({
  id: true,
  createdByUpdatedBy: true,
  timestamps: true,
  members: true,
  checklists: true,
  currentTimeline: true,
  actualTimeline: true,
  budgetEstimate: true,
  budgetActual: true,
  status: true,
  progress: true,
}).extend({
  members: z.array(
    ProjectMemberSchema.omit({ isOwner: true, name: true, avatar: true })
  ),
  timeline: ProjectTimelineSchema,
  budgetEstimate: z.number(),
})

export const UpdateProjectSchema = ProjectSchema.omit({
  id: true,
  createdByUpdatedBy: true,
  timestamps: true,
  budgetEstimate: true,
  checklists: true,
}).partial()

export const CreateColumnSchema = ColumnSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
})

export const UpdateColumnSchema = z.object({
  id: z.string(),
  label: z.string(),
  order: z.number().optional(),
  parentId: z.string().optional(),
})
