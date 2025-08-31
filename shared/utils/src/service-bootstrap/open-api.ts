import type { OpenAPIHono } from "@hono/zod-openapi"
import { apiReference } from "@scalar/hono-api-reference"
import type { Env } from "hono"

export function setupOpenApi<T extends Env>(
  app: OpenAPIHono<T>,
  basePath: string,
  title?: string
) {
  app.doc(`${basePath}/openapi.json`, {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: title ?? "Open Api Docs",
    },
  })

  app.get(
    `${basePath}/reference`,
    apiReference({
      spec: {
        url: `${basePath}/openapi.json`,
      },
      customCss: `
        /* Hide only Tasks tag navigation - be specific to avoid breaking sidebar */
        
        /* Target specific Tasks tag links only */
        a[href="#tag/Tasks"],
        a[href="#tag%2FTasks"],
        a[href$="/tag/Tasks"],
        a[href*="#tag/Tasks"]:not([href*="projects"]):not([href*="healthcheck"]) {
          display: none !important;
        }
        
        /* Hide only the list item that contains ONLY a Tasks tag link */
        li:has(> a[href="#tag/Tasks"]):not(:has(a[href*="/api/projects/"])),
        li:has(> a[href*="#tag/Tasks"]):not(:has(> :not(a[href*="#tag/Tasks"]))) {
          display: none !important;
        }
        
        /* Hide Tasks in the tag section of main content */
        section[data-section-id="tag/Tasks"],
        div[id="tag/Tasks"],
        div[data-target="#tag/Tasks"] {
          display: none !important;
        }
        
        /* Hide empty tag groups after removing Tasks */
        .tag-group:has(> :only-child:hidden),
        ul:has(> li):not(:has(> li:not([style*="display: none"]))) {
          display: none !important;
        }
        
        /* Add a prominent notice about tasks documentation */
        .scalar-api-reference > div:first-child::before,
        .references-sidebar::before,
        body::before {
          content: "📌 For Tasks API documentation, visit /tasks/reference";
          display: block !important;
          padding: 12px;
          background: #e0f2fe;
          border-left: 4px solid #0284c7;
          margin: 16px;
          color: #0c4a6e;
          font-weight: 600;
          font-family: system-ui, sans-serif;
          z-index: 9999;
          position: sticky;
          top: 0;
        }
        
        /* Ensure the notice is visible */
        body::before {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 10000 !important;
        }
        
      `,
    })
  )

  app.openAPIRegistry.registerComponent("securitySchemes", "cookieAuth", {
    type: "apiKey",
    in: "cookie",
    name: "session",
  })
}
