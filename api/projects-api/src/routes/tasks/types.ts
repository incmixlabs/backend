import { z } from "@hono/zod-openapi"
import { ChecklistItemSchema, TaskSchema } from "@incmix-api/utils/zod-schema"

export const TaskIdSchema = z
  .object({
    taskId: z
      .string()
      .openapi({ example: "1", param: { name: "taskId", in: "path" } }),
  })
  .openapi("Task Params")

export const ChecklistIdSchema = z.object({
  taskId: z.string().openapi({ example: "2hek2bkjh" }),
  checklistId: z.string().openapi({ example: "2hek2bkjh" }),
})

export const TaskListSchema = z.array(TaskSchema)

export const CreateTaskSchema = TaskSchema.pick({
  name: true,
  description: true,
  taskOrder: true,
  projectId: true,
  statusId: true,
  priorityId: true,
  labelsTags: true,
  refUrls: true,
  attachments: true,
  checklist: true,
  acceptanceCriteria: true,
}).extend({
  parentTaskId: z.string().optional(),
  startDate: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
  endDate: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
  assignedTo: z.array(z.string()).optional(),
})

export const UpdateTaskSchema = TaskSchema.pick({
  name: true,
  description: true,
  taskOrder: true,
  projectId: true,
  statusId: true,
  priorityId: true,
  labelsTags: true,
  refUrls: true,
  attachments: true,
  acceptanceCriteria: true,
  startDate: true,
  endDate: true,
})
  .extend({
    parentTaskId: z.string().optional(),
    startDate: z
      .string()
      .datetime()
      .openapi({ example: new Date("2025-01-01").toISOString() }),
    endDate: z
      .string()
      .datetime()
      .openapi({ example: new Date("2025-01-01").toISOString() }),
    assignedTo: z.array(z.string()).optional(),
  })
  .partial()

export const AddTaskChecklistSchema = z.object({
  checklist: ChecklistItemSchema.omit({ id: true }),
})

export const UpdateTaskChecklistSchema = z.object({
  checklist: ChecklistItemSchema.omit({ id: true }).partial(),
})

export const RemoveTaskChecklistSchema = z.object({
  checklistIds: z.array(z.string()).openapi({ example: ["2hek2bkjh"] }),
})

export const JobSchema = z.object({
  taskId: z.string().openapi({ example: "2hek2bkjh" }),
  jobTitle: z.string().openapi({ example: "Task Title" }),
  jobId: z.string().optional().openapi({ example: "2hek2bkjh" }),
  status: z
    .enum(["pending", "in_progress", "completed", "failed", "unknown"])
    .openapi({
      example: "pending",
    }),
})

export const TaskJobsSchema = z.object({
  userStory: z.array(JobSchema),
  codegen: z.array(JobSchema),
})

export type JobSchema = z.infer<typeof JobSchema>

export const BulkAiGenTaskSchema = z.object({
  type: z.enum(["user-story", "codegen"]),
  taskIds: z
    .array(z.string())
    .min(1)
    .openapi({ example: ["2hek2bkjh"] }),
})
