import { LabelSchema } from "@incmix-api/utils/zod-schema"
import { z } from "zod"

export const PullLabelsSchema = z.object({
  lastPulledAt: z.string().optional(),
})

export const LabelSchemaWithTimeStamps = LabelSchema.omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  createdAt: z.number(),
  updatedAt: z.number(),
})

export type LabelWithTimeStamps = z.infer<typeof LabelSchemaWithTimeStamps>

export const PushLabelsSchema = z.object({
  changeRows: z.array(
    z.object({
      id: z.string().optional(),
      newDocumentState: LabelSchemaWithTimeStamps,
      assumedMasterState: LabelSchemaWithTimeStamps.optional(),
    })
  ),
})
