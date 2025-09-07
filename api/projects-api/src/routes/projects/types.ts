import {
  ChecklistItemSchema,
  ProjectSchema,
} from "@incmix-api/utils/zod-schema"
import { z } from "zod"

export const IdSchema = z.object({
  id: z.string(),
})

export const OrgIdSchema = z.object({
  orgId: z.string(),
})

export const ChecklistIdSchema = z.object({
  projectId: z.string(),
  checklistId: z.string(),
})

export const ProjectListSchema = ProjectSchema.omit({
  createdBy: true,
  updatedBy: true,
  members: true,
  createdAt: true,
  updatedAt: true,
  startDate: true,
  endDate: true,
  checklist: true,
  acceptanceCriteria: true,
}).array()

export const CreateProjectSchema = ProjectSchema.pick({
  name: true,
  orgId: true,
  description: true,
  status: true,
  startDate: true,
  endDate: true,
  company: true,
}).extend({
  id: z.string().optional(),
  logo: z.instanceof(File).optional(),
  budget: z.coerce.number().int().nullish(),
  acceptanceCriteria: z.string().optional(),
  checklist: z.string().optional(),
  members: z.string().optional(),
})

export const UpdateProjectSchema = ProjectSchema.pick({
  name: true,
  description: true,
  status: true,
  startDate: true,
  endDate: true,
  budget: true,
  company: true,
}).partial()

export const AddProjectMemberSchema = z.object({
  members: z.array(
    z.object({
      id: z.string(),
      role: z.string().optional().default("project_member"),
    })
  ),
})

export const RemoveProjectMemberSchema = z.object({
  memberIds: z.array(z.string()),
})

export const AddProjectChecklistSchema = z.object({
  checklist: ChecklistItemSchema.omit({ id: true }),
})

export const UpdateProjectChecklistSchema = z.object({
  checklist: ChecklistItemSchema.omit({ id: true }),
})

export const RemoveProjectChecklistSchema = z.object({
  checklistIds: z.array(z.string()),
})
