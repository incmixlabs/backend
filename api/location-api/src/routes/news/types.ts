import { z } from "@hono/zod-openapi"

export const NewsQuerySchema = z.object({
  topicToken: z.string().openapi({
    example: "CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB",
  }),
  country: z.string().optional().openapi({ example: "us" }),
})

export const TopicQuerySchema = z.object({
  country: z.string().optional().openapi({ example: "us" }),
})

export const TopicSchema = z.object({
  title: z.string().openapi({ example: "Technology" }),
  topic_toke: z.string().openapi({
    example: "CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB",
  }),
})

export type TopicApiResponse = z.infer<typeof TopicSchema>

export const TopicResponseSchema = z.object({
  topics: z.array(TopicSchema),
  country: z.string().openapi({ example: "us" }),
})

export const NewsStorySchema = z.object({
  title: z.string().openapi({ example: "Article Title" }),
  source: z.object({
    name: z.string().openapi({ example: "Fox news" }),
    icon: z.string().url().openapi({ example: "https://example.com/icon.png" }),
    authors: z
      .array(z.string())
      .optional()
      .openapi({ example: ["author1", "author2"] }),
  }),
  link: z.string().url().openapi({ example: "https://example.com" }),
  date: z.string().openapi({ example: "1 Day ago" }),
  thumbnail: z
    .string()
    .openapi({ example: "https://example.com/thumbnail.jpg" }),
})

export const NewsSchema = z.object({
  position: z.number().openapi({ example: 1 }),
  highlight: NewsStorySchema,
  stories: z.array(
    NewsStorySchema.and(
      z.object({ position: z.number().openapi({ example: 1 }) })
    )
  ),
})

export const NewsResponseSchema = z.array(NewsSchema)
export type NewsResponse = z.infer<typeof NewsResponseSchema>

const SerpApiSchema = z.array(NewsSchema.and(NewsStorySchema))

export type NewsApiResponse = {
  news_results: z.infer<typeof SerpApiSchema>
}
