import { ChecklistItemSchema, TaskSchema } from "@incmix-api/utils/zod-schema"
import { z } from "zod"

export const TaskIdSchema = z.object({
  taskId: z.string(),
})

export const ChecklistIdSchema = z.object({
  taskId: z.string(),
  checklistId: z.string(),
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
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
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
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
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
  checklistIds: z.array(z.string()),
})

export const JobSchema = z.object({
  taskId: z.string(),
  jobTitle: z.string(),
  jobId: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "failed", "unknown"]),
})

export const TaskJobsSchema = z.object({
  userStory: z.array(JobSchema),
  codegen: z.array(JobSchema),
})

export type JobSchema = z.infer<typeof JobSchema>

export const BulkAiGenTaskSchema = z.object({
  type: z.enum(["user-story", "codegen"]),
  taskIds: z.array(z.string()).min(1),
})
