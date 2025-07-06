import { TaskSchema } from "@incmix/utils/types"
import { z } from "zod"

export const PullTasksSchema = z.object({
  lastPulledAt: z.string().optional(),
})

export const PushTasksSchema = z.object({
  changeRows: z.array(
    z.object({
      id: z.string().optional(),
      newDocumentState: TaskSchema,
      assumedMasterState: TaskSchema.optional(),
    })
  ),
})
