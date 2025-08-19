import { z } from "@hono/zod-openapi"
import { ChecklistSchema, ProjectSchema } from "@incmix-api/utils/zod-schema"

export const IdSchema = z.object({
  id: z.string().openapi({ example: "2hek2bkjh" }),
})

export const OrgIdSchema = z.object({
  orgId: z.string().openapi({ example: "org123" }),
})

export const ChecklistIdSchema = z.object({
  projectId: z.string().openapi({ example: "2hek2bkjh" }),
  checklistId: z.string().openapi({ example: "2hek2bkjh" }),
})

export const ProjectListSchema = ProjectSchema.omit({
  createdBy: true,
  updatedBy: true,
  members: true,
  createdAt: true,
  updatedAt: true,
  startDate: true,
  endDate: true,
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
  id: z.string().optional().openapi({ example: "2hek2bkjh" }),
  logo: z.custom<File>(),
  budget: z
    .number({ coerce: true })
    .int()
    .nullish()
    .openapi({ example: 10000 }),
  acceptanceCriteria: z.string().optional(),
  checklist: z.string().optional(),
  members: z.string().optional().openapi({ example: "user1,user2,user3" }),
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
  members: z
    .array(
      z.object({
        id: z.string().openapi({ example: "user123" }),
        role: z
          .string()
          .optional()
          .default("project_member")
          .openapi({ example: "project_member" }),
      })
    )
    .openapi({ example: [{ id: "user123", role: "member" }] }),
})

export const RemoveProjectMemberSchema = z.object({
  memberIds: z.array(z.string()).openapi({ example: ["2hek2bkjh"] }),
})

export const AddProjectChecklistSchema = z.object({
  checklist: ChecklistSchema.omit({ id: true }),
})

export const UpdateProjectChecklistSchema = z.object({
  checklist: ChecklistSchema.omit({ id: true }),
})

export const RemoveProjectChecklistSchema = z.object({
  checklistIds: z.array(z.string()).openapi({ example: ["2hek2bkjh"] }),
})
