import { ProjectSchema } from "@incmix-api/utils/zod-schema"
import { z } from "zod"

export const PullProjectsSchema = z.object({
  lastPulledAt: z.string().optional(),
})

const RxdbProjectSchema = ProjectSchema.pick({
  id: true,
  name: true,
  orgId: true,
  company: true,
  logo: true,
  status: true,
  budget: true,
  description: true,
})

export const ProjectSchemaWithTimeStamps = RxdbProjectSchema.extend({
  startDate: z.number().nullish(),
  endDate: z.number().nullish(),
  createdAt: z.number(),
  updatedAt: z.number(),
  createdBy: z.string(),
  updatedBy: z.string(),
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
