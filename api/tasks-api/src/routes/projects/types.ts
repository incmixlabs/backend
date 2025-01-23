import { z } from "@hono/zod-openapi"
import { ColumnSchema, ProjectSchema } from "@incmix/utils/types"

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
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
})

export const CreateColumnSchema = ColumnSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
})
