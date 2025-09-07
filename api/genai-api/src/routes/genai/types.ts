import { z } from "zod"

export const GenerateUserStorySchema = z.object({
  prompt: z.string().min(3).max(500),
  userTier: z.enum(["free", "paid"]).default("free"),
  templateId: z.number(),
})

export const UserStoryResponseSchema = z.object({
  userStory: z.object({
    description: z.string(),
    acceptanceCriteria: z.array(z.string()),
    checklist: z.array(z.string()),
  }),
  imageUrl: z.string().url().optional(),
})

export type UserStoryResponse = z.infer<typeof UserStoryResponseSchema>

export const FigmaSchema = z.object({
  url: z.string().url(),
  prompt: z.string().optional(),
  userTier: z.enum(["free", "paid"]).default("free"),
  templateId: z.number(),
})

export const GenerateCodeFromFigmaSchema = z.object({
  url: z.string().url(),
  userTier: z.enum(["free", "paid"]).default("free"),
  framework: z.enum(["react", "vue", "angular", "html"]).default("react"),
  styling: z
    .enum(["tailwind", "css", "styled-components", "css-modules"])
    .default("tailwind"),
  typescript: z.boolean().default(false),
  responsive: z.boolean().default(true),
  accessibility: z.boolean().default(true),
  componentLibrary: z.string().optional(),
})

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

export const GenerateMultipleUserStoriesSchema = z.object({
  description: z.string().min(3).max(1000),
  successCriteria: z.array(z.string()).min(1),
  checklist: z.array(z.string()).min(1),
  userTier: z.enum(["free", "paid"]).default("free"),
  templateId: z.number(),
})

export const MultipleUserStoriesResponseSchema = z.object({
  userStories: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        acceptanceCriteria: z.array(z.string()),
        checklist: z.array(z.string()),
      })
    )
    .length(3),
})

export type MultipleUserStoriesResponse = z.infer<
  typeof MultipleUserStoriesResponseSchema
>

export const GenerateProjectHierarchySchema = z.object({
  projectDescription: z.string().min(10).max(2000),
  userTier: z.enum(["free", "paid"]).default("free"),
  templateId: z.number().optional(),
})

export const ProjectHierarchyResponseSchema = z.object({
  project: z.object({
    title: z.string(),
    description: z.string(),
    epics: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        features: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            stories: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                description: z.string(),
                acceptanceCriteria: z.array(z.string()),
                estimatedPoints: z.number().optional(),
              })
            ),
          })
        ),
      })
    ),
  }),
})

export type ProjectHierarchyResponse = z.infer<
  typeof ProjectHierarchyResponseSchema
>
