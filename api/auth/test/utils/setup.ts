import { mockApi, mockFetch, resetMocks, testDb } from "@incmix-api/test-utils"
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest"

// Initialize mocks immediately
mockApi()
global.fetch = mockFetch

// Global test setup
beforeAll(async () => {
  try {
    await testDb.setup()
    console.log("🚀 Test environment initialized")
  } catch (error) {
    console.error("❌ Failed to setup test environment:", error)
    throw error
  }
})

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
