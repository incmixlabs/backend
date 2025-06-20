import { z } from "@hono/zod-openapi"

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
    userStory: z.object({
      description: z.string().openapi({
        example:
          "As a user, I want to create a dashboard so that I can monitor progress at a glance.",
        description: "Generated user story in markdown format",
      }),
      acceptanceCriteria: z.array(z.string()).openapi({
        example: [
          "The dashboard should display key metrics",
          "Users can customize the layout",
          "Information updates in real-time",
        ],
        description: "Acceptance criteria for the user story",
      }),
      checklist: z.array(z.string()).openapi({
        example: [
          "The dashboard should display key metrics",
          "Users can customize the layout",
          "Information updates in real-time",
        ],
        description: "Checklist for the user story",
      }),
    }),
    imageUrl: z.string().url().optional().openapi({
      example: "https://www.figma.com/design/1234567890/1234567890",
      description: "URL of the image",
    }),
  })
  .openapi("UserStoryResponse")

export type UserStoryResponse = z.infer<typeof UserStoryResponseSchema>

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
    templateId: z.number().openapi({
      example: 1,
      description: "ID of the story template to use",
    }),
  })
  .openapi("FigmaSchema")
