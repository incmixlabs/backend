import { z } from "@hono/zod-openapi"
import { ChecklistSchema, TaskSchema } from "@incmix/utils/types"

export const TaskIdSchema = z
  .object({
    taskId: z
      .string()
      .openapi({ example: "1", param: { name: "taskId", in: "path" } }),
  })
  .openapi("Task Params")

export const ChecklistIdSchema = z
  .object({
    checklistId: z
      .string()
      .openapi({ example: "1", param: { name: "checklistId", in: "path" } }),
  })
  .openapi("Checklist Params")

export const TaskListSchema = z.array(
  TaskSchema.omit({
    checklists: true,
    codeSnippets: true,
    figmaLink: true,
    comments: true,
  })
)

export const CreateTaskSchema = TaskSchema.pick({
  title: true,
  content: true,
  taskOrder: true,
  columnId: true,
  assignedTo: true,
  projectId: true,
}).extend({
  startDate: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
  endDate: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
})

export const UpdateTaskSchema = TaskSchema.pick({
  title: true,
  content: true,
  taskOrder: true,
  projectId: true,
  columnId: true,
  assignedTo: true,
  status: true,
})
  .extend({
    startDate: z
      .string()
      .datetime()
      .openapi({ example: new Date("2025-01-01").toISOString() }),
    endDate: z
      .string()
      .datetime()
      .openapi({ example: new Date("2025-01-01").toISOString() }),
  })
  .partial()
  .extend({
    id: z.string().openapi({ example: "1" }),
  })

export const AddTaskChecklistSchema = z.object({
  checklist: ChecklistSchema.pick({ title: true }),
})

export const UpdateTaskChecklistSchema = z.object({
  checklist: ChecklistSchema.pick({
    title: true,
    status: true,
  }).partial(),
})

export const RemoveTaskChecklistSchema = z.object({
  checklistIds: z.array(z.string()).openapi({ example: ["2hek2bkjh"] }),
})
