import { defineConfig } from "@playwright/test"
export default defineConfig({
  testDir: "./e2e",
  use: {
    // All requests we send go to this API endpoint.
    baseURL: "https://auth-api-dev-prev.uincmix.workers.dev",
    extraHTTPHeaders: {
      origin: "http://localhost:1420",
      "accept-language": "en",
    },
  },
})
