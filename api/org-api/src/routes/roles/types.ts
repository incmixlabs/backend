import { z } from "zod"

export const OrgIdSchema = z.object({
  orgId: z.string().optional(),
})

export const IdSchema = z.object({
  id: z.coerce.number(),
})

export const AddNewRoleSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(3).max(255),
  scope: z.enum(["org", "project"]),
})

export const UpdateRoleSchema = AddNewRoleSchema.partial()
