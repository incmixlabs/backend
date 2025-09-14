import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { createClient } from "redis"
import { envVars } from "../../env-vars"
import { getLocationFromIp } from "../../lib/helper"
import type { NewsApiResponse, NewsResponse, TopicApiResponse } from "./types"

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
              example: "us",
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
          searchParams.append("gl", country)
        } else {
          const location = await getLocationFromIp(request)
          searchParams.append("gl", location.country_code.toLowerCase())
        }

        // Redis caching
        let redis: any
        try {
          if (envVars.REDIS_URL) {
            redis = createClient({ url: envVars.REDIS_URL })
            await redis.connect()

            const key = `news:topics:${searchParams.toString()}`
            const cache = await redis.get(key)

            if (cache) {
              console.log("news:topics cache hit")
              const parsedCache = JSON.parse(cache) as TopicApiResponse[]
              await redis.quit()

              return reply.send({
                topics: parsedCache,
                country: searchParams.get("gl") ?? "us",
              })
            }
          }
        } catch (redisError) {
          console.warn("Redis error, continuing without cache:", redisError)
        }

        // Fetch from API
        searchParams.append("api_key", envVars.SERP_API_KEY)
        const res = await fetch(
          `${envVars.SERP_NEWS_URL}?${searchParams.toString()}`
        )

        if (!res.ok) {
          const { error } = (await res.json()) as { error: string }
          return reply.code(400).send({ message: error })
        }

        const data = (await res.json()) as { menu_links: TopicApiResponse[] }
        const topics = data.menu_links || []

        // Cache the result
        if (redis?.isOpen) {
          try {
            const key = `news:topics:${searchParams.toString().replace(/api_key=[^&]+/, "")}`
            await redis.setEx(key, 3600, JSON.stringify(topics)) // Cache for 1 hour
            await redis.quit()
          } catch (cacheError) {
            console.warn("Failed to cache result:", cacheError)
          }
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

        // Redis caching
        let redis: any
        try {
          if (envVars.REDIS_URL) {
            redis = createClient({ url: envVars.REDIS_URL })
            await redis.connect()

            const key = `news:${searchParams.toString()}`
            const cache = await redis.get(key)

            if (cache) {
              console.log("news cache hit")
              const parsedCache = JSON.parse(cache) as NewsResponse
              await redis.quit()
              return reply.send(parsedCache)
            }
          }
        } catch (redisError) {
          console.warn("Redis error, continuing without cache:", redisError)
        }

        // Fetch from API
        searchParams.append("api_key", envVars.SERP_API_KEY)
        const res = await fetch(
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

        // Cache the result
        if (redis?.isOpen) {
          try {
            const key = `news:${searchParams.toString().replace(/api_key=[^&]+/, "")}`
            await redis.setEx(key, 1800, JSON.stringify(formattedNews)) // Cache for 30 minutes
            await redis.quit()
          } catch (cacheError) {
            console.warn("Failed to cache result:", cacheError)
          }
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
