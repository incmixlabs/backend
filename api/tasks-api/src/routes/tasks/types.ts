import { z } from "@hono/zod-openapi"
import {
  checklistStatusEnum,
  taskStatusEnum,
} from "@incmix-api/utils/db-schema"

export const ParamSchema = z
  .object({
    id: z.string().openapi({ example: "1", param: { name: "id", in: "path" } }),
  })
  .openapi("Params")

export const ChecklistSchema = z.object({
  id: z.string().openapi({ example: "2hek2bkjh" }),
  title: z.string().openapi({ example: "Checklist Item" }),
  status: z.enum(checklistStatusEnum).openapi({ example: "todo" }),
  createdBy: z.string().openapi({ example: "2hek2bkjh" }),
  updatedBy: z.string().openapi({ example: "2hek2bkjh" }),
  createdAt: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
  updatedAt: z
    .string()
    .datetime()
    .openapi({ example: new Date("2025-01-01").toISOString() }),
})

export const TaskSchema = z.object({
  id: z.string().openapi({ example: "1" }),
  title: z.string().openapi({ example: "Create a dashboard" }),
  content: z.string().openapi({ example: "Detailed description of the task" }),
  taskOrder: z.number().openapi({ example: 1 }),
  figmaLink: z
    .string()
    .url()
    .nullish()
    .openapi({ example: "https://figma.com/file/123" }),
  codeSnippets: z.array(z.string()).nullish(),
  status: z
    .enum(taskStatusEnum)
    .openapi({ example: "backlog" })
    .default("backlog"),
  checklists: z.array(
    ChecklistSchema.pick({ id: true, title: true, status: true })
  ),
  projectId: z.string().openapi({ example: "proj_123" }),
  columnId: z.string().nullish().openapi({ example: "col_123" }),
  assignedTo: z.string().nullish().openapi({ example: "user_123" }),
  currentTimelineStartDate: z.string().datetime().nullish(),
  currentTimelineEndDate: z.string().datetime().nullish(),
  actualTimelineStartDate: z.string().datetime().nullish(),
  actualTimelineEndDate: z.string().datetime().nullish(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(),
  updatedBy: z.string(),
})

export const TaskListSchema = z.array(
  TaskSchema.omit({
    checklists: true,
    codeSnippets: true,
    figmaLink: true,
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

export const GenerateUserStorySchema = z
  .object({
    prompt: z.string().min(3).max(500).openapi({
      example: "create a dashboard",
      description:
        "A short description of the feature for user story generation",
    }),
    userTier: z.enum(["free", "paid"]).default("free").openapi({
      example: "free",
      description:
        "User tier determines which AI model to use (free: Gemini, paid: Claude)",
    }),
    templateId: z.number().openapi({
      example: 1,
      description: "ID of the story template to use",
    }),
  })
  .openapi("GenerateUserStory")

export const UserStoryResponseSchema = z
  .object({
    userStory: z.string().openapi({
      example:
        "As a user, I want to create a dashboard so that I can monitor progress at a glance.\n\nAcceptance Criteria:\n- The dashboard should display key metrics\n- Users can customize the layout\n- Information updates in real-time",
      description: "Generated user story in markdown format",
    }),
    imageUrl: z.string().url().optional().openapi({
      example: "https://www.figma.com/design/1234567890/1234567890",
      description: "URL of the image",
    }),
  })
  .openapi("UserStoryResponse")

export const FigmaSchema = z
  .object({
    url: z.string().url().openapi({
      example: "https://www.figma.com/design/1234567890/1234567890",
    }),
    prompt: z.string().optional().openapi({
      example: "create a dashboard",
      description:
        "A short description of the feature for user story generation",
    }),
    userTier: z.enum(["free", "paid"]).default("free").openapi({
      example: "free",
      description:
        "User tier determines which AI model to use (free: Gemini, paid: Claude)",
    }),
  })
  .openapi("FigmaSchema")

export const AddTaskChecklistSchema = z.object({
  taskId: z.string().openapi({ example: "2hek2bkjh" }),
  checklist: ChecklistSchema.pick({ title: true }),
})

export const UpdateTaskChecklistSchema = z.object({
  id: z.string().openapi({ example: "2hek2bkjh" }),
  checklist: ChecklistSchema.pick({
    title: true,
    status: true,
  }).partial(),
})

export const RemoveTaskChecklistSchema = z.object({
  taskId: z.string().openapi({ example: "2hek2bkjh" }),
  checklistIds: z.array(z.string()).openapi({ example: ["2hek2bkjh"] }),
})
