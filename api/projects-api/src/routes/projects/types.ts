import { z } from "@hono/zod-openapi"
import {
  ChecklistSchema,
  ProjectMemberSchema,
  ProjectSchema,
} from "@incmix/utils/types"

export const IdSchema = z.object({
  id: z.string().openapi({ example: "2hek2bkjh" }),
})

export const CreateProjectSchema = ProjectSchema.omit({
  id: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateProjectSchema = ProjectSchema.omit({
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
}).partial()

export const AddProjectMemberSchema = z.object({
  members: z.array(ProjectMemberSchema.pick({ id: true, role: true })),
})
export const RemoveProjectMemberSchema = z.object({
  memberIds: z.array(z.string()).openapi({ example: ["2hek2bkjh"] }),
})

export const AddProjectChecklistSchema = z.object({
  checklist: ChecklistSchema.pick({ title: true }),
})

export const UpdateProjectChecklistSchema = z.object({
  checklist: ChecklistSchema.pick({
    title: true,
    status: true,
  }).partial(),
})

export const RemoveProjectChecklistSchema = z.object({
  checklistIds: z.array(z.string()).openapi({ example: ["2hek2bkjh"] }),
})
