import {
  mockApi,
  mockFetch,
  resetMocks,
  setupTestEnv,
  testDb,
} from "@incmix-api/test-utils"
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest"

// Global test setup
beforeAll(async () => {
  // Set NODE_ENV first to ensure proper env file loading
  process.env.NODE_ENV = "test"

  // Setup test environment
  const testEnv = setupTestEnv()
  await testDb.setup()
  const connectionString = testDb.getConnectionString()
  process.env = { ...process.env, ...testEnv, DATABASE_URL: connectionString }
  mockApi()
  global.fetch = mockFetch

  // Initialize test database

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
export * from "@incmix-api/test-utils"
export { testDb } from "@incmix-api/test-utils"
