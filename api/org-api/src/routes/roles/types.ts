import { z } from "@hono/zod-openapi"

export const OrgIdSchema = z.object({
  orgId: z.string().optional().openapi({
    example: "123",
    description: "The id of the Org",
  }),
})

export const IdSchema = z.object({
  id: z.coerce.number().openapi({
    example: 1,
    description: "The id of the role",
  }),
})

export const AddNewRoleSchema = z
  .object({
    name: z.string().min(3).max(50).openapi({
      example: "project_admin",
      description: "The name of the role",
    }),
    description: z.string().min(3).max(255).openapi({
      example: "Project admin role",
      description: "The description of the role",
    }),
    scope: z.enum(["org", "project"]).openapi({
      example: "org",
      description: "The scope of the role",
    }),
  })
  .openapi("AddNewRoleSchema")

export const UpdateRoleSchema =
  AddNewRoleSchema.partial().openapi("UpdateRoleSchema")
