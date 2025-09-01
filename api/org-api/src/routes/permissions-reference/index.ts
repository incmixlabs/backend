import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { getRolesPermissions, updatePermissions } from "@/routes/permissions/openapi"
import { addNewRole, updateRole, deleteRole } from "@/routes/roles/openapi"
import { apiReference } from "@scalar/hono-api-reference"

const permissionsReferenceRoutes = new OpenAPIHono<HonoApp>()

// Setup OpenAPI documentation for permissions (must be before parameterized routes)
permissionsReferenceRoutes.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Permissions API",
    description: "API for managing roles and permissions within organizations. Auth via cookieAuth (session).",
  },
  tags: [
    {
      name: "Permissions",
      description: "Role and permission management operations",
    },
  ],
})

permissionsReferenceRoutes.get(
  "/",
  apiReference({
    spec: {
      url: "/api/org/permissions/reference/openapi.json",
    },
  })
)

// Note: /openapi.json is automatically created by permissionsReferenceRoutes.doc() above

permissionsReferenceRoutes.openAPIRegistry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "session",
})

// Add the permissions and roles routes for OpenAPI docs only
permissionsReferenceRoutes.openapi(getRolesPermissions, () => new Response("Not implemented", { status: 501 }))
permissionsReferenceRoutes.openapi(updatePermissions, () => new Response("Not implemented", { status: 501 }))
permissionsReferenceRoutes.openapi(addNewRole, () => new Response("Not implemented", { status: 501 }))
permissionsReferenceRoutes.openapi(updateRole, () => new Response("Not implemented", { status: 501 }))
permissionsReferenceRoutes.openapi(deleteRole, () => new Response("Not implemented", { status: 501 }))

export default permissionsReferenceRoutes