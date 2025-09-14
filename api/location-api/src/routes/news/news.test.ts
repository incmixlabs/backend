import fastify, { type FastifyInstance } from "fastify"
import type { RedisClientType } from "redis"
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"
import { setupNewsRoutes } from "./index"

declare module "fastify" {
  interface FastifyInstance {
    redis: RedisClientType
  }
}
// Mock environment variables
vi.mock("../../env-vars", () => ({
  envVars: {
    SERP_API_KEY: "test-api-key",
    SERP_NEWS_URL: "https://api.example.com/news",
    NODE_ENV: "test",
  },
}))

// Mock helper functions
vi.mock("../../lib/helper", () => ({
  fetchWithTimeout: vi.fn(),
  getLocationFromIp: vi.fn().mockResolvedValue({
    country_code: "US",
  }),
}))

describe("News Routes with Redis Caching", () => {
  let app: FastifyInstance
  let mockRedisClient: Partial<RedisClientType>

  beforeAll(async () => {
    // Create a mock Redis client
    mockRedisClient = {
      get: vi.fn(),
      setEx: vi.fn(),
      del: vi.fn().mockResolvedValue(1),
      isOpen: true,
      connect: vi.fn().mockResolvedValue(undefined),
      quit: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue("PONG"),
    }

    // Create Fastify app
    app = fastify({ logger: false })

    // Mock the Redis plugin to inject our mock client
    app.decorate("redis", mockRedisClient as RedisClientType)

    // Setup news routes
    setupNewsRoutes(app)

    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /news/topics", () => {
    it("should return cached topics when available", async () => {
      const cachedTopics = [
        {
          title: "Business",
          topic_token:
            "CAAqKggKIiRDQkFTRlFvSUwyMHZNRGx6TVdZU0JXVnVMVWRDR2dKVlV5Z0FQAQ",
        },
        {
          title: "Technology",
          topic_token:
            "CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB",
        },
      ]

      ;(mockRedisClient.get as any).mockResolvedValue(
        JSON.stringify(cachedTopics)
      )

      const response = await app.inject({
        method: "GET",
        url: "/news/topics?country=us",
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.topics).toEqual(cachedTopics)
      expect(body.country).toBe("us")
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        expect.stringContaining("news:topics:")
      )
      expect(mockRedisClient.setEx).not.toHaveBeenCalled()
    })

    it("should fetch from API when cache miss", async () => {
      const apiTopics = [
        {
          title: "World",
          topic_token:
            "CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB",
        },
        {
          title: "Nation",
          topic_token:
            "CAAqIggKIhxDQkFTRHdvSkwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB",
        },
      ]

      ;(mockRedisClient.get as any).mockResolvedValue(null)

      const { fetchWithTimeout } = await import("../../lib/helper")
      ;(fetchWithTimeout as any).mockResolvedValue({
        ok: true,
        json: async () => ({ menu_links: apiTopics }),
      })

      const response = await app.inject({
        method: "GET",
        url: "/news/topics?country=uk",
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.topics).toEqual(apiTopics)
      expect(body.country).toBe("uk")
      expect(mockRedisClient.get).toHaveBeenCalled()
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        expect.stringContaining("news:topics:"),
        3600,
        JSON.stringify(apiTopics)
      )
    })

    it("should use IP-based location when country not provided", async () => {
      ;(mockRedisClient.get as any).mockResolvedValue(null)

      const { fetchWithTimeout, getLocationFromIp } = await import(
        "../../lib/helper"
      )
      ;(getLocationFromIp as any).mockResolvedValue({ country_code: "CA" })
      ;(fetchWithTimeout as any).mockResolvedValue({
        ok: true,
        json: async () => ({ menu_links: [] }),
      })

      const response = await app.inject({
        method: "GET",
        url: "/news/topics",
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.country).toBe("ca")
      expect(getLocationFromIp).toHaveBeenCalled()
    })

    it("should handle API errors gracefully", async () => {
      ;(mockRedisClient.get as any).mockResolvedValue(null)

      const { fetchWithTimeout } = await import("../../lib/helper")
      ;(fetchWithTimeout as any).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "API limit exceeded" }),
      })

      const response = await app.inject({
        method: "GET",
        url: "/news/topics?country=us",
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.message).toBe("API limit exceeded")
    })

    it("should handle fetch errors gracefully", async () => {
      ;(mockRedisClient.get as any).mockResolvedValue(null)

      const { fetchWithTimeout } = await import("../../lib/helper")
      ;(fetchWithTimeout as any).mockRejectedValue(new Error("Network error"))

      const response = await app.inject({
        method: "GET",
        url: "/news/topics?country=us",
      })

      expect(response.statusCode).toBe(500)
      const body = JSON.parse(response.body)
      expect(body.message).toBe("Failed to fetch news topics")
    })
  })

  describe("GET /news", () => {
    it("should return cached news when available", async () => {
      const cachedNews = [
        {
          position: 1,
          highlight: {
            title: "Breaking News",
            source: { name: "CNN", icon: "icon.png", authors: ["John Doe"] },
            link: "https://example.com/news1",
            date: "2024-01-01",
            thumbnail: "thumb.jpg",
          },
          stories: [],
        },
      ]

      ;(mockRedisClient.get as any).mockResolvedValue(
        JSON.stringify(cachedNews)
      )

      const response = await app.inject({
        method: "GET",
        url: "/news?topicToken=test-token&country=us",
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toEqual(cachedNews)
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        expect.stringContaining("news:")
      )
      expect(mockRedisClient.setEx).not.toHaveBeenCalled()
    })

    it("should fetch from API when cache miss", async () => {
      const apiNews = {
        news_results: [
          {
            highlight: {
              title: "Latest Update",
              source: { name: "BBC", icon: "bbc.png", authors: ["Jane Smith"] },
              link: "https://example.com/news2",
              date: "2024-01-02",
              thumbnail: "thumb2.jpg",
            },
            stories: [
              {
                position: 1,
                title: "Related Story",
                source: { name: "Reuters", icon: "reuters.png", authors: [] },
                link: "https://example.com/related",
                date: "2024-01-02",
                thumbnail: "related.jpg",
              },
            ],
          },
        ],
      }

      ;(mockRedisClient.get as any).mockResolvedValue(null)

      const { fetchWithTimeout } = await import("../../lib/helper")
      ;(fetchWithTimeout as any).mockResolvedValue({
        ok: true,
        json: async () => apiNews,
      })

      const response = await app.inject({
        method: "GET",
        url: "/news?topicToken=test-token&country=us",
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body[0].position).toBe(1)
      expect(body[0].highlight).toEqual(apiNews.news_results[0].highlight)
      expect(body[0].stories).toEqual(apiNews.news_results[0].stories)
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        expect.stringContaining("news:"),
        1800,
        expect.any(String)
      )
    })

    it("should require topicToken parameter", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/news",
      })

      expect(response.statusCode).toBe(400)
    })

    it("should handle missing news_results gracefully", async () => {
      ;(mockRedisClient.get as any).mockResolvedValue(null)

      const { fetchWithTimeout } = await import("../../lib/helper")
      ;(fetchWithTimeout as any).mockResolvedValue({
        ok: true,
        json: async () => ({}), // Empty response
      })

      const response = await app.inject({
        method: "GET",
        url: "/news?topicToken=test-token",
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toEqual([])
    })

    it("should transform news items without highlight field", async () => {
      const apiNews = {
        news_results: [
          {
            title: "Direct News",
            source: { name: "AP", icon: "ap.png", authors: [] },
            link: "https://example.com/direct",
            date: "2024-01-03",
            thumbnail: "direct.jpg",
            stories: [],
          },
        ],
      }

      ;(mockRedisClient.get as any).mockResolvedValue(null)

      const { fetchWithTimeout } = await import("../../lib/helper")
      ;(fetchWithTimeout as any).mockResolvedValue({
        ok: true,
        json: async () => apiNews,
      })

      const response = await app.inject({
        method: "GET",
        url: "/news?topicToken=test-token",
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body[0].highlight.title).toBe("Direct News")
      expect(body[0].highlight.source).toEqual(apiNews.news_results[0].source)
    })
  })

  describe("Redis Functionality", () => {
    it("should have Redis client available", () => {
      expect(app.redis).toBeDefined()
      expect(app.redis.get).toBeDefined()
      expect(app.redis.setEx).toBeDefined()
      expect(app.redis.isOpen).toBe(true)
    })

    it("should handle Redis operations", async () => {
      // Test set and get
      const testKey = `test:key:${Date.now()}`
      const testValue = "test-value"

      // Mock the get to return the value after setEx is called
      ;(mockRedisClient.setEx as any).mockImplementation(
        (key: string, _ttl: number, value: string) => {
          if (key === testKey) {
            ;(mockRedisClient.get as any).mockResolvedValue(value)
          }
          return Promise.resolve("OK")
        }
      )

      await app.redis.setEx(testKey, 60, testValue)
      const retrieved = await app.redis.get(testKey)

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(testKey, 60, testValue)
      expect(retrieved).toBe(testValue)

      // Clean up
      await app.redis.del(testKey)
      expect(mockRedisClient.del).toHaveBeenCalledWith(testKey)
    })
  })
})
