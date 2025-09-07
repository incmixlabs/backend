import { z } from "zod"

export const NewsQuerySchema = z.object({
  topicToken: z.string(),
  country: z.string().optional(),
})

export const TopicQuerySchema = z.object({
  country: z.string().optional(),
})

export const TopicSchema = z.object({
  title: z.string(),
  topic_toke: z.string(),
})

export type TopicApiResponse = z.infer<typeof TopicSchema>

export const TopicResponseSchema = z.object({
  topics: z.array(TopicSchema),
  country: z.string(),
})

export const NewsStorySchema = z.object({
  title: z.string(),
  source: z.object({
    name: z.string(),
    icon: z.string().url(),
    authors: z.array(z.string()).optional(),
  }),
  link: z.string().url(),
  date: z.string(),
  thumbnail: z.string(),
})

export const NewsSchema = z.object({
  position: z.number(),
  highlight: NewsStorySchema,
  stories: z.array(NewsStorySchema.and(z.object({ position: z.number() }))),
})

export const NewsResponseSchema = z.array(NewsSchema)
export type NewsResponse = z.infer<typeof NewsResponseSchema>

const SerpApiSchema = z.array(NewsSchema.and(NewsStorySchema))

export type NewsApiResponse = {
  news_results: z.infer<typeof SerpApiSchema>
}
