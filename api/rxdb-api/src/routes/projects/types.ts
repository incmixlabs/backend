import { ProjectSchema } from "@incmix-api/utils/zod-schema"
import { z } from "zod"

export const PullProjectsSchema = z.object({
  lastPulledAt: z.string().optional(),
})

export const ProjectSchemaWithTimeStamps = ProjectSchema.omit({
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.number().nullish(),
  endDate: z.number().nullish(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export type ProjectWithTimeStamps = z.infer<typeof ProjectSchemaWithTimeStamps>

export const PushProjectsSchema = z.object({
  changeRows: z.array(
    z.object({
      id: z.string().optional(),
      newDocumentState: ProjectSchemaWithTimeStamps,
      assumedMasterState: ProjectSchemaWithTimeStamps.optional(),
    })
  ),
})
