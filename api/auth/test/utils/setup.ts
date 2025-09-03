import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest"
import { testDb } from "./database"
import { mockFetch, resetMocks, setupIntlMocks, setupTestEnv } from "./mocks"

// Global test setup
beforeAll(async () => {
  // Set NODE_ENV first to ensure proper env file loading
  process.env.NODE_ENV = "test"

  // Setup test environment
  const testEnv = setupTestEnv()
  process.env = { ...process.env, ...testEnv }

  // Setup mocks
  setupIntlMocks()
  global.fetch = mockFetch as any

  // Initialize test database
  await testDb.setup()

  console.log("🚀 Test environment initialized")
})

afterAll(async () => {
  // Cleanup test database
  await testDb.cleanup()

  console.log("🧹 Test environment cleaned up")
})

beforeEach(() => {
  // Reset mocks before each test
  resetMocks()
})

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks()
})

// Export utilities for use in tests
export { testDb } from "./database"
export * from "./mocks"
