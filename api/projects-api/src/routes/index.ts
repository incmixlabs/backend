import { BASE_PATH } from "@/lib/constants"
import healthcheckRoutes from "@/routes/healthcheck"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { apiReference } from "@scalar/hono-api-reference"
import projectRoutes from "./projects"
import tasksRoutes from "./tasks"

export const routes = (app: OpenAPIHono<HonoApp>) => {
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
  app.route(BASE_PATH, projectRoutes)

  // Set up separate OpenAPI documentation for tasks BEFORE mounting task routes
  // This ensures /tasks/reference doesn't get caught by /tasks/:taskId
  app.doc(`${BASE_PATH}/tasks/openapi.json`, (_c) => ({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Tasks API Documentation",
    },
    servers: [
      {
        url: `${BASE_PATH}/tasks`,
        description: "Tasks API",
      },
    ],
  }))

  // Set up separate reference documentation for tasks
  app.get(`${BASE_PATH}/tasks/reference`, (c) => {
    // Add script to clean URL hash fragments
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tasks API</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { margin: 0; padding: 0; }
          iframe { width: 100%; height: 100vh; border: none; }
        </style>
      </head>
      <body>
        <div id="api-reference"></div>
        <script>
          // Clean hash from URL without affecting navigation
          if (window.location.hash) {
            history.replaceState(null, null, window.location.pathname + window.location.search);
          }
        </script>
        <script id="api-reference" data-url="${BASE_PATH}/tasks/openapi.json"></script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest"></script>
      </body>
      </html>
    `
    return c.html(html)
  })

  // Mount tasks routes AFTER the reference endpoint
  app.route(`${BASE_PATH}/tasks`, tasksRoutes)
}
