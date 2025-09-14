// Load shared SSR globals before other imports
import "../../../../shared/utils/vitest.setup"
import { mockApi, mockFetch, resetMocks, testDb } from "@incmix-api/test-utils"
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest"

// Global test setup
beforeAll(async () => {
  mockApi()
  await testDb.setup()
  global.fetch = mockFetch
  console.log("🚀 Test environment initialized")
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
