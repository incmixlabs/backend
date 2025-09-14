import { vi } from "vitest"

// Setup test environment variables
process.env.NODE_ENV = "test"
// Use Redis URL with authentication from .env.test
process.env.REDIS_URL =
  process.env.REDIS_URL || "redis://:redis_password@localhost:6379"
process.env.SERP_API_KEY = "test-api-key"
process.env.SERP_NEWS_URL = "https://api.example.com/news"

// Don't mock console in integration tests - we need to see the output
// Uncomment below to mock console in unit tests if needed
// global.console = {
//   ...console,
//   log: vi.fn(),
//   debug: vi.fn(),
//   info: vi.fn(),
//   warn: vi.fn(),
//   error: vi.fn(),
// }
