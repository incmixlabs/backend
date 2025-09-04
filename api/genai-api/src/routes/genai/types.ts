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

export const GenerateMultipleUserStoriesSchema = z
  .object({
    description: z.string().min(3).max(1000).openapi({
      example:
        "A project management dashboard for tracking tasks and progress.",
      description: "Project description for user story generation",
    }),
    successCriteria: z
      .array(z.string())
      .min(1)
      .openapi({
        example: [
          "The dashboard should allow users to add, edit, and delete tasks.",
          "Users can filter tasks by status.",
        ],
        description: "Success criteria for the project",
      }),
    checklist: z
      .array(z.string())
      .min(1)
      .openapi({
        example: ["Implement authentication", "Set up database schema"],
        description: "Checklist items for the project",
      }),
    userTier: z.enum(["free", "paid"]).default("free").openapi({
      example: "free",
      description:
        "User tier determines which AI model to use (free: Gemini, paid: Claude)",
    }),
    templateId: z.number().openapi({
      example: 1,
      description: "ID of the story template to use (optional)",
    }),
  })
  .openapi("GenerateMultipleUserStories")

export const MultipleUserStoriesResponseSchema = z
  .object({
    userStories: z
      .array(
        z.object({
          title: z.string().openapi({
            example: "Add tasks to the dashboard",
            description: "Generated user story title",
          }),
          description: z.string().openapi({
            example:
              "As a user, I want to add tasks to the dashboard so that I can track my work.",
            description: "Generated user story description",
          }),
          acceptanceCriteria: z.array(z.string()).openapi({
            example: [
              "Tasks can be added with a title and description.",
              "Tasks appear in the dashboard immediately after creation.",
            ],
            description: "Acceptance criteria for the user story",
          }),
          checklist: z.array(z.string()).openapi({
            example: ["Add task form UI", "API endpoint for task creation"],
            description: "Checklist for the user story",
          }),
        })
      )
      .length(3),
  })
  .openapi("MultipleUserStoriesResponse")

export type MultipleUserStoriesResponse = z.infer<
  typeof MultipleUserStoriesResponseSchema
>

export const GenerateProjectHierarchySchema = z
  .object({
    projectDescription: z.string().min(10).max(2000).openapi({
      example: "Create an ecommerce portal that accepts international orders and payments, and enables international shipments (split shipments), tracking and returns.",
      description: "Detailed description of the project to generate epics, features, and stories for",
    }),
    userTier: z.enum(["free", "paid"]).default("free").openapi({
      example: "free",
      description: "User tier determines which AI model to use (free: Gemini, paid: Claude)",
    }),
    templateId: z.number().optional().openapi({
      example: 1,
      description: "ID of the story template to use (optional)",
    }),
  })
  .openapi("GenerateProjectHierarchy")

export const ProjectHierarchyResponseSchema = z
  .object({
    project: z.object({
      title: z.string().openapi({
        example: "International E-Commerce Platform",
        description: "Project title",
      }),
      description: z.string().openapi({
        example: "A comprehensive e-commerce solution with global capabilities",
        description: "Project description",
      }),
      epics: z.array(
        z.object({
          id: z.string().openapi({
            example: "epic-1",
            description: "Epic identifier",
          }),
          title: z.string().openapi({
            example: "User Management & Authentication",
            description: "Epic title",
          }),
          description: z.string().openapi({
            example: "Comprehensive user account management system with secure authentication",
            description: "Epic description",
          }),
          features: z.array(
            z.object({
              id: z.string().openapi({
                example: "feature-1-1",
                description: "Feature identifier",
              }),
              title: z.string().openapi({
                example: "User Registration",
                description: "Feature title",
              }),
              description: z.string().openapi({
                example: "Allow users to create new accounts",
                description: "Feature description",
              }),
              stories: z.array(
                z.object({
                  id: z.string().openapi({
                    example: "story-1-1-1",
                    description: "Story identifier",
                  }),
                  title: z.string().openapi({
                    example: "Email Registration",
                    description: "Story title",
                  }),
                  description: z.string().openapi({
                    example: "As a user, I want to register with my email so that I can create an account",
                    description: "User story description",
                  }),
                  acceptanceCriteria: z.array(z.string()).openapi({
                    example: [
                      "User can enter email and password",
                      "Email validation is performed",
                      "Password strength requirements are enforced",
                    ],
                    description: "Acceptance criteria for the user story",
                  }),
                  estimatedPoints: z.number().optional().openapi({
                    example: 3,
                    description: "Story points estimate",
                  }),
                })
              ).openapi({
                description: "User stories within the feature",
              }),
            })
          ).openapi({
            description: "Features within the epic",
          }),
        })
      ).openapi({
        description: "List of epics in the project",
      }),
    }),
  })
  .openapi("ProjectHierarchyResponse")

export type ProjectHierarchyResponse = z.infer<typeof ProjectHierarchyResponseSchema>
