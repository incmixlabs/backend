import { TaskSchema } from "@incmix-api/utils/zod-schema"
import { z } from "zod"

export const PullTasksSchema = z.object({
  lastPulledAt: z.string().optional(),
})

const TaskSchemaWithTimeStamps = TaskSchema.omit({
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.number(),
  endDate: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const PushTasksSchema = z.object({
  changeRows: z.array(
    z.object({
      id: z.string().optional(),
      newDocumentState: TaskSchemaWithTimeStamps,
      assumedMasterState: TaskSchemaWithTimeStamps.optional(),
    })
  ),
})
