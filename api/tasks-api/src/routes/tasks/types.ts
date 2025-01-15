import { TaskSchema } from "@incmix/shared/types"

import { z } from "@hono/zod-openapi"

export const ParamSchema = z
  .object({
    id: z.string().openapi({ example: "1", param: { name: "id", in: "path" } }),
  })
  .openapi("Params")

export const TaskListSchema = z.array(TaskSchema)

export const CreateTaskSchema = TaskSchema.omit({
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  id: true,
})
export const UpdateTaskSchema = CreateTaskSchema.partial()
