import { z } from "@hono/zod-openapi"
import type { DdlSchema } from "@incmix/utils/types"
import { ColumnSchema, TaskSchema } from "@incmix/utils/types"

export const VersionSchema = z.object({
  version: z.number(),
  schema: z.custom<DdlSchema>().array(),
})

export const PushChangesSchema = z.object({
  columns: z.object({
    updates: ColumnSchema.array(),
    deletes: z.string().array(),
  }),
  tasks: z.object({
    updates: TaskSchema.array(),
    deletes: z.string().array(),
  }),
})

export const PullChangesSchema = z.object({
  columns: ColumnSchema.array(),
  tasks: TaskSchema.array(),
})

export const SyncQuerySchema = z.object({
  projectId: z.string(),
})
