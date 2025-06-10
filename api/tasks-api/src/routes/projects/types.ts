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
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
  endDate: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
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
  members: z.array(ProjectMemberSchema),
  status: z.enum(projectStatusEnum).openapi({ example: "todo" }),
  currentTimelineStartDate: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
  currentTimelineEndDate: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
  actualTimelineStartDate: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
  actualTimelineEndDate: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
  budgetEstimate: z.number({ coerce: true }).openapi({ example: 100000 }),
  budgetActual: z
    .number({ coerce: true })
    .nullish()
    .openapi({ example: 100000 }),
  checklists: z.array(ProjectChecklistSchema),
  createdBy: z.string().openapi({ example: "2hek2bkjh" }),
  updatedBy: z.string().openapi({ example: "2hek2bkjh" }),
  createdAt: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
  updatedAt: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
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
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  members: true,
  checklists: true,
  currentTimelineStartDate: true,
  currentTimelineEndDate: true,
  actualTimelineStartDate: true,
  actualTimelineEndDate: true,
  budgetActual: true,
  status: true,
  logo: true,
}).extend({
  // members: z.array(
  //   ProjectMemberSchema.omit({ isOwner: true, name: true, avatar: true })
  // ),
  startDate: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
  endDate: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
  logo: z.instanceof(File),
})

export const UpdateProjectSchema = ProjectSchema.omit({
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  checklists: true,
  members: true,
  logo: true,
  actualTimelineStartDate: true,
  actualTimelineEndDate: true,
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
