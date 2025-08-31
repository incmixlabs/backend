import { defineConfig } from "@playwright/test"
export default defineConfig({
  testDir: "./e2e",
  use: {
    // All requests we send go to this API endpoint.
    baseURL: "https://projects-api-dev-prev.uincmix.workers.dev",
    extraHTTPHeaders: {
      "content-type": "application/json",
      origin: "http://localhost:1420",
      "accept-language": "en",
    },
  },
})
