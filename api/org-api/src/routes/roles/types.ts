import { z } from "@hono/zod-openapi"
export const AddNewRoleSchema = z
  .object({
    name: z.string().min(3).max(50).openapi({
      example: "Admin",
      description: "The name of the role",
    }),
    description: z.string().min(3).max(255).openapi({
      example: "Admin role",
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
