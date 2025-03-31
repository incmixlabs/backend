import { TaskSchema } from "@incmix/utils/types"

import { z } from "@hono/zod-openapi"

export const ParamSchema = z
  .object({
    id: z.string().openapi({ example: "1", param: { name: "id", in: "path" } }),
  })
  .openapi("Params")

export const TaskListSchema = z.array(TaskSchema)

export const CreateTaskSchema = TaskSchema.omit({
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  id: true,
})
export const UpdateTaskSchema = CreateTaskSchema.partial()

export const GenerateUserStorySchema = z
  .object({
    prompt: z.string().min(3).max(500).openapi({
      example: "create a dashboard",
      description: "A short description of the feature for user story generation",
    }),
    userTier: z
      .enum(["free", "paid"])
      .default("free")
      .openapi({
        example: "free",
        description: "User tier determines which AI model to use (free: Gemini, paid: Claude)",
      }),
  })
  .openapi("GenerateUserStory")

export const UserStoryResponseSchema = z
  .object({
    userStory: z.string().openapi({
      example: "As a user, I want to create a dashboard so that I can monitor progress at a glance.\n\nAcceptance Criteria:\n- The dashboard should display key metrics\n- Users can customize the layout\n- Information updates in real-time",
      description: "Generated user story in markdown format",
    }),
  })
  .openapi("UserStoryResponse")
