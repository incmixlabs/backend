import { z } from "zod"

export const storyTemplateSchema = z.object({
  id: z.number(),
  name: z.string(),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type StoryTemplate = z.infer<typeof storyTemplateSchema>

export const newStoryTemplateSchema = storyTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const updatedStoryTemplateSchema = storyTemplateSchema.partial()
