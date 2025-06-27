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

export const GenerateCodeFromFigmaSchema = z
  .object({
    url: z.string().url().openapi({
      example: "https://www.figma.com/design/1234567890/1234567890",
      description: "Figma design URL to generate code from",
    }),
    userTier: z.enum(["free", "paid"]).default("free").openapi({
      example: "free",
      description:
        "User tier determines which AI model to use (free: Gemini, paid: Claude)",
    }),
    framework: z
      .enum(["react", "vue", "angular", "html"])
      .default("react")
      .openapi({
        example: "react",
        description: "Target framework for code generation",
      }),
    styling: z
      .enum(["tailwind", "css", "styled-components", "css-modules"])
      .default("tailwind")
      .openapi({
        example: "tailwind",
        description: "Styling approach for the generated code",
      }),
    typescript: z.boolean().default(false).openapi({
      example: false,
      description: "Whether to generate TypeScript code",
    }),
    responsive: z.boolean().default(true).openapi({
      example: true,
      description: "Whether to generate responsive code",
    }),
    accessibility: z.boolean().default(true).openapi({
      example: true,
      description: "Whether to include accessibility features",
    }),
    componentLibrary: z.string().optional().openapi({
      example: "material-ui",
      description:
        "Optional component library to use (e.g., material-ui, antd)",
    }),
  })
  .openapi("GenerateCodeFromFigma")

export const CodeGenerationResponseSchema = z.object({
  type: z.enum(["status", "message", "done", "error"]),
  content: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
  done: z.boolean().optional(),
})

export type CodeGenerationResponse = z.infer<
  typeof CodeGenerationResponseSchema
>
