import { defineConfig } from "@playwright/test"
export default defineConfig({
  testDir: "./e2e",
  use: {
    // All requests we send go to this API endpoint.
    baseURL: process.env.E2E_BASE_URL || "http://localhost:8888",
    extraHTTPHeaders: {
      "content-type": "application/json",
      origin: "http://localhost:1420",
      "accept-language": "en",
    },
  },
})
