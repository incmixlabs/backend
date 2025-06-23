import { z } from "@hono/zod-openapi"
import {
  ChecklistSchema,
  ColumnSchema,
  ProjectMemberSchema,
  ProjectSchema,
  TaskSchema,
} from "@incmix/utils/types"

export const IdSchema = z.object({
  id: z.string().openapi({ example: "2hek2bkjh" }),
})
export const ParentColumnIdSchema = z.object({
  parentColumnId: z.string().optional().openapi({ example: "2hek2bkjh" }),
})

export const CreateProjectSchema = ProjectSchema.omit({
  id: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  members: true,
  checklists: true,
  currentTimelineStartDate: true,
  currentTimelineEndDate: true,
  actualTimelineStartDate: true,
  actualTimelineEndDate: true,
  budgetActual: true,
  status: true,
  logo: true,
}).extend({
  startDate: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
  endDate: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
  logo: z.instanceof(File),
})

export const UpdateProjectSchema = ProjectSchema.omit({
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  checklists: true,
  members: true,
  logo: true,
  actualTimelineStartDate: true,
  actualTimelineEndDate: true,
}).partial()

export const CreateColumnSchema = ColumnSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
})

export const UpdateColumnSchema = z.object({
  id: z.string(),
  label: z.string(),
  order: z.number().optional(),
  parentId: z.string().optional(),
})

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

export const AddProjectCommentSchema = z.object({
  comment: z.object({
    content: z.string().openapi({ example: "This is a comment" }),
  }),
})

export const UpdateProjectCommentSchema = z.object({
  comment: z.object({
    content: z.string().openapi({ example: "Updated comment content" }),
  }),
})

export const RemoveProjectCommentSchema = z.object({
  commentId: z.string().openapi({ example: "2hek2bkjh" }),
})

export const ColumnWithTaskSchema = ColumnSchema.extend({
  tasks: TaskSchema.array(),
})

export type ColumnWithTasks = z.infer<typeof ColumnWithTaskSchema>
type ColumnWithChildren = ColumnWithTasks & {
  children?: ColumnWithChildren[]
}

export const NestedColumnSchema: z.ZodType<ColumnWithChildren> =
  ColumnWithTaskSchema.extend({
    children: z
      .lazy(() => NestedColumnSchema.array())
      .optional()
      .openapi({ type: "array" }),
  })

export type NestedColumns = z.infer<typeof NestedColumnSchema>

export const BoardSchema = z.object({
  project: ProjectSchema,
  columns: NestedColumnSchema.array(),
  tasks: TaskSchema.array(),
})

export type Board = z.infer<typeof BoardSchema>
