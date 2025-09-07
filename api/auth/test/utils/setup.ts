import { mockApi, mockFetch, resetMocks, testDb } from "@incmix-api/test-utils"
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest"

// Global test setup
beforeAll(async () => {
  mockApi()
  try {
    await testDb.setup()
    global.fetch = mockFetch
    console.log("🚀 Test environment initialized")
  } catch (error) {
    console.error("❌ Failed to setup test environment:", error)
    throw error
  }
}, 120000) // 2 minute timeout for setup

beforeEach(() => {
  // Reset mocks before each test
  resetMocks()
})

afterAll(async () => {
  await testDb.cleanup()
})

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks()
})

// Export utilities for use in tests
export * from "@incmix-api/test-utils"
