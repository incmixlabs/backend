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
      description:
        "A short description of the feature for user story generation",
    }),
    userTier: z.enum(["free", "paid"]).default("free").openapi({
      example: "free",
      description:
        "User tier determines which AI model to use (free: Gemini, paid: Claude)",
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
    layerName: z.string().openapi({
      example: "Dashboard Page",
      description: "Name of the layer to generate task for",
    }),
    prompt: z.string().openapi({
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
