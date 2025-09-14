import {
  setupRedisFastifyPlugin,
  shutdownRedis,
} from "@incmix-api/utils/middleware"
import fastify, { type FastifyInstance } from "fastify"
import { createClient, type RedisClientType } from "redis"
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

// Skip these tests if Redis is not available
const SKIP_INTEGRATION = process.env.SKIP_INTEGRATION_TESTS === "true"

// Mock environment variables
vi.mock("../../env-vars", () => ({
  envVars: {
    SERP_API_KEY: "test-api-key",
    SERP_NEWS_URL: "https://serpapi.com/search",
    NODE_ENV: "test",
    REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  },
}))

// Mock the fetch helper to avoid real API calls
vi.mock("../../lib/helper", () => ({
  fetchWithTimeout: vi.fn().mockImplementation((url: string) => {
    // Parse the URL to determine what to return
    if (url.includes("topic_token=")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          news_results: [
            {
              highlight: {
                title: "Test News Article",
                source: {
                  name: "Test Source",
                  icon: "icon.png",
                  authors: ["Test Author"],
                },
                link: "https://example.com/article",
                date: "2 hours ago",
                thumbnail: "thumb.jpg",
              },
              stories: [],
            },
          ],
        }),
      })
    } else {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          menu_links: [
            { title: "Business", topic_token: "token_business" },
            { title: "Technology", topic_token: "token_tech" },
          ],
        }),
      })
    }
  }),
  getLocationFromIp: vi.fn().mockResolvedValue({
    country_code: "US",
  }),
}))

describe.skipIf(SKIP_INTEGRATION)(
  "News Routes - Redis Integration Tests",
  () => {
    let app: FastifyInstance
    let testRedisClient: RedisClientType

    beforeAll(async () => {
      // Create a test Redis client to clean up test data
      const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"
      testRedisClient = createClient({ url: redisUrl })

      try {
        await testRedisClient.connect()
      } catch (error) {
        console.warn("Could not connect to Redis for integration tests:", error)
        return
      }

      try {
        // Create Fastify app with real Redis plugin
        app = fastify({ logger: false })

        // Register the real Redis plugin
        await app.register(setupRedisFastifyPlugin)

        // Setup news routes
        setupNewsRoutes(app)

        await app.ready()
      } catch (error) {
        console.warn("Could not set up Fastify with Redis plugin:", error)
        // Skip tests if plugin registration fails
        return
      }
    })

    afterAll(async () => {
      // Clean up test data
      if (testRedisClient?.isOpen) {
        const keys = await testRedisClient.keys("news:*test*")
        if (keys.length > 0) {
          await testRedisClient.del(keys)
        }
        await testRedisClient.quit()
      }

      if (app) {
        await app.close()
      }

      // Shutdown the singleton Redis client
      await shutdownRedis()
    })

    beforeEach(async () => {
      // Clear any test-related cache keys
      if (testRedisClient?.isOpen) {
        const keys = await testRedisClient.keys("news:*test*")
        if (keys.length > 0) {
          await testRedisClient.del(keys)
        }
      }
    })

    describe("Redis Caching Behavior", () => {
      it("should cache and retrieve news topics", async () => {
        // First request - should hit the API and cache
        const response1 = await app.inject({
          method: "GET",
          url: "/news/topics?country=us",
        })

        expect(response1.statusCode).toBe(200)
        const body1 = JSON.parse(response1.body)
        expect(body1.topics).toHaveLength(2)
        expect(body1.topics[0].title).toBe("Business")

        // Check that data was cached
        const cacheKey = "news:topics:engine=google_news&hl=en&gl=us"
        const cachedData = await testRedisClient.get(cacheKey)
        expect(cachedData).toBeTruthy()
        const parsedCache = JSON.parse(cachedData!)
        expect(parsedCache).toHaveLength(2)
        expect(parsedCache[0].title).toBe("Business")

        // Second request - should hit the cache
        const response2 = await app.inject({
          method: "GET",
          url: "/news/topics?country=us",
        })

        expect(response2.statusCode).toBe(200)
        const body2 = JSON.parse(response2.body)
        expect(body2).toEqual(body1) // Should be identical
      })

      it("should cache news articles with TTL", async () => {
        const topicToken = `test_token_${Date.now()}`

        // First request - should cache with 30 minute TTL
        const response1 = await app.inject({
          method: "GET",
          url: `/news?topicToken=${topicToken}&country=us`,
        })

        expect(response1.statusCode).toBe(200)
        const body1 = JSON.parse(response1.body)
        expect(body1).toHaveLength(1)
        expect(body1[0].highlight.title).toBe("Test News Article")

        // Check TTL
        const cacheKey = `news:engine=google_news&topic_token=${topicToken}&gl=us`
        const ttl = await testRedisClient.ttl(cacheKey)
        expect(ttl).toBeGreaterThan(0)
        expect(ttl).toBeLessThanOrEqual(1800) // 30 minutes

        // Second request - should use cache
        const response2 = await app.inject({
          method: "GET",
          url: `/news?topicToken=${topicToken}&country=us`,
        })

        expect(response2.statusCode).toBe(200)
        const body2 = JSON.parse(response2.body)
        expect(body2).toEqual(body1)
      })

      it("should use different cache keys for different countries", async () => {
        // Request for US
        const responseUS = await app.inject({
          method: "GET",
          url: "/news/topics?country=us",
        })

        expect(responseUS.statusCode).toBe(200)
        const bodyUS = JSON.parse(responseUS.body)
        expect(bodyUS.country).toBe("us")

        // Request for UK (will get same mock data but different cache key)
        const responseUK = await app.inject({
          method: "GET",
          url: "/news/topics?country=uk",
        })

        expect(responseUK.statusCode).toBe(200)
        const bodyUK = JSON.parse(responseUK.body)
        expect(bodyUK.country).toBe("uk")

        // Verify different cache keys exist
        const cacheKeyUS = "news:topics:engine=google_news&hl=en&gl=us"
        const cacheKeyUK = "news:topics:engine=google_news&hl=en&gl=uk"

        const [cacheUS, cacheUK] = await Promise.all([
          testRedisClient.get(cacheKeyUS),
          testRedisClient.get(cacheKeyUK),
        ])

        expect(cacheUS).toBeTruthy()
        expect(cacheUK).toBeTruthy()
      })

      it("should handle Redis errors gracefully", async () => {
        // Temporarily break Redis connection
        const originalGet = app.redis.get
        ;(app.redis as any).get = vi
          .fn()
          .mockRejectedValue(new Error("Redis error"))

        // Should still work without cache
        const response = await app.inject({
          method: "GET",
          url: "/news/topics?country=us",
        })

        expect(response.statusCode).toBe(200)
        const body = JSON.parse(response.body)
        expect(body.topics).toHaveLength(2)

        // Restore Redis
        ;(app.redis as any).get = originalGet
      })
    })

    describe("Redis Health Check", () => {
      it("should report healthy Redis status", async () => {
        const response = await app.inject({
          method: "GET",
          url: "/health/redis",
        })

        expect(response.statusCode).toBe(200)
        const body = JSON.parse(response.body)
        expect(body.status).toBe("healthy")
        expect(body.isConnected).toBe(true)
        expect(body.hasClient).toBe(true)
      })
    })
  }
)
