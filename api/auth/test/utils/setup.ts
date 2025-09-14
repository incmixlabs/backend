// Define SSR globals BEFORE any imports that might need them
;(globalThis as any).__vite_ssr_exportName__ = (name: string, value: any) => ({
  [name]: value,
})
;(globalThis as any).__vite_ssr_importName__ = (mod: any, name: string) =>
  mod[name]
;(globalThis as any).__vite_ssr_importDefaultName__ = (mod: any) =>
  mod.default || mod
;(globalThis as any).__vite_ssr_dynamic_import__ = (url: string) => import(url)
;(globalThis as any).__vite_ssr_exportAll__ = (obj: any, mod: any) =>
  Object.assign(obj, mod)
;(globalThis as any).__vite_ssr_import_meta__ = import.meta

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
