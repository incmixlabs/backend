import { fetchWithTimeout } from "@incmix-api/utils"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { envVars } from "../../env-vars"
import { getLocationFromIp } from "../../lib/helper"
import type { NewsApiResponse, NewsResponse, TopicApiResponse } from "./types"

const NEWS_TTL_SECONDS = 1800

export const setupNewsRoutes = (app: FastifyInstance) => {
  // Get news topics endpoint
  app.get(
    "/news/topics",
    {
      schema: {
        description: "Get news topics for a specific location",
        tags: ["news"],
        querystring: {
          type: "object",
          properties: {
            country: {
              type: "string",
              description: "Country code (e.g., us, uk, ca)",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              topics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    topic_token: { type: "string" },
                  },
                },
              },
              country: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: { country?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { country } = request.query

        const searchParams = new URLSearchParams({
          engine: "google_news",
          hl: "en",
        })

        if (country) {
          searchParams.append("gl", country.toLowerCase())
        } else {
          const location = await getLocationFromIp(request)
          searchParams.append("gl", location.country_code.toLowerCase())
        }

        // Redis caching (read) - with error handling
        const cacheKey = `news:topics:${searchParams.toString()}`
        let cache: string | null = null
        try {
          cache = await app.redis.get(cacheKey)
        } catch (error) {
          console.warn("Redis get error, continuing without cache:", error)
        }

        if (cache) {
          console.log("news:topics cache hit")
          return reply.send({
            topics: JSON.parse(cache) as TopicApiResponse[],
            country: searchParams.get("gl") ?? "us",
          })
        }

        // Fetch from API
        searchParams.append("api_key", envVars.SERP_API_KEY)
        const res = await fetchWithTimeout(
          `${envVars.SERP_NEWS_URL}?${searchParams.toString()}`
        )

        if (!res.ok) {
          const { error } = (await res.json()) as { error: string }
          return reply.code(400).send({ message: error })
        }

        const data = (await res.json()) as { menu_links: TopicApiResponse[] }
        const topics = data.menu_links || []

        // Cache the result (write) - with error handling
        try {
          await app.redis.setEx(
            cacheKey,
            NEWS_TTL_SECONDS,
            JSON.stringify(topics)
          )
        } catch (error) {
          console.warn("Redis setEx error, continuing without caching:", error)
        }

        return reply.send({
          topics,
          country: searchParams.get("gl") ?? "us",
        })
      } catch (error) {
        console.error("Error fetching news topics:", error)
        return reply.code(500).send({
          message: "Failed to fetch news topics",
        })
      }
    }
  )

  // Get news by topic endpoint
  app.get(
    "/news",
    {
      schema: {
        description: "Get news for a specific topic",
        tags: ["news"],
        querystring: {
          type: "object",
          required: ["topicToken"],
          properties: {
            topicToken: {
              type: "string",
              description: "Topic token from the topics endpoint",
            },
            country: {
              type: "string",
              description: "Country code (e.g., us, uk, ca)",
            },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                position: { type: "number" },
                highlight: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    source: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        icon: { type: "string" },
                        authors: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                    },
                    link: { type: "string" },
                    date: { type: "string" },
                    thumbnail: { type: "string" },
                  },
                },
                stories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      position: { type: "number" },
                      title: { type: "string" },
                      source: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          icon: { type: "string" },
                          authors: {
                            type: "array",
                            items: { type: "string" },
                          },
                        },
                      },
                      link: { type: "string" },
                      date: { type: "string" },
                      thumbnail: { type: "string" },
                    },
                  },
                },
              },
            },
          },
          400: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: { topicToken: string; country?: string }
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { topicToken, country } = request.query

        const searchParams = new URLSearchParams({
          engine: "google_news",
          topic_token: topicToken,
        })

        if (country) {
          searchParams.append("gl", country)
        } else {
          const location = await getLocationFromIp(request)
          searchParams.append("gl", location.country_code.toLowerCase())
        }

        // Redis caching (read) - with error handling
        const cacheKey = `news:${searchParams.toString()}`
        let cache: string | null = null
        try {
          cache = await app.redis.get(cacheKey)
        } catch (error) {
          console.warn("Redis get error, continuing without cache:", error)
        }

        if (cache) {
          console.log("news cache hit")
          return reply.send(JSON.parse(cache) as NewsResponse)
        }

        // Fetch from API
        searchParams.append("api_key", envVars.SERP_API_KEY)
        const res = await fetchWithTimeout(
          `${envVars.SERP_NEWS_URL}?${searchParams.toString()}`
        )

        if (!res.ok) {
          const { error } = (await res.json()) as { error: string }
          return reply.code(400).send({ message: error })
        }

        const data = (await res.json()) as NewsApiResponse
        const newsResults = data.news_results || []

        // Transform the data to match our schema
        const formattedNews: NewsResponse = newsResults.map(
          (item: any, index: number) => ({
            position: index + 1,
            highlight: item.highlight || {
              title: item.title,
              source: item.source,
              link: item.link,
              date: item.date,
              thumbnail: item.thumbnail,
            },
            stories: item.stories || [],
          })
        )

        // Cache the result (write) - with error handling
        try {
          await app.redis.setEx(cacheKey, 1800, JSON.stringify(formattedNews)) // 30 minutes
        } catch (error) {
          console.warn("Redis setEx error, continuing without caching:", error)
        }

        return reply.send(formattedNews)
      } catch (error) {
        console.error("Error fetching news:", error)
        return reply.code(500).send({
          message: "Failed to fetch news",
        })
      }
    }
  )
}
