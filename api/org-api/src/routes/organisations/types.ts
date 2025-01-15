import { z } from "@hono/zod-openapi"
import { MemberRoles } from "@incmix/shared/types"

export const MessageResponseSchema = z
  .object({
    message: z.string().openapi({
      example: "Successful",
    }),
  })
  .openapi("Response")

export const MemberSchema = z
  .object({
    userId: z.string().openapi({
      example: "93jpbulpkkavxnz",
    }),
    role: z.enum(MemberRoles).default("viewer").openapi({ example: "viewer" }),
  })
  .openapi("Member")

export const MemberEmailSchema = z
  .object({
    email: z.string().email("Invalid Email"),
    role: z.enum(MemberRoles).default("viewer").openapi({ example: "viewer" }),
  })
  .openapi("Member")

export const OrgSchema = z
  .object({
    id: z
      .string({ required_error: "Id is Required" })
      .openapi({ example: "123456886" }),
    name: z
      .string({ required_error: "Organisation Name is required" })
      .openapi({ example: "Test Organisation" }),
    handle: z
      .string({ required_error: "Organisation Handle is required" })
      .openapi({ example: "test-organisation" }),
    members: z.array(MemberSchema).openapi({
      example: [
        {
          userId: "93jpbulpkkavxnz",
          role: "viewer",
        },
      ],
    }),
  })
  .openapi("Organisation")

export const OrgHandleSchema = z.object({
  handle: z.string().openapi({
    example: "test-organisation",
  }),
})

export const OrgIdSchema = z.object({
  id: z.string().openapi({
    example: "123456886",
  }),
})

export const SuccessSchema = z
  .object({
    success: z.boolean().openapi({
      example: true,
    }),
  })
  .openapi("SuccessSchema")

export const CreateOrgSchema = z
  .object({
    name: z
      .string({ required_error: "Organisation Name is required" })
      .openapi({ example: "Test Organisation" }),
    handle: z.string().openapi({
      example: "test-organisation",
    }),
    members: z.array(MemberSchema).openapi({
      example: [{ userId: "93jpbulpkkavxnz", role: "viewer" }],
    }),
  })
  .openapi("Create Organisation")

export const UpdateOrgSchema = z
  .object({
    name: z
      .string({ required_error: "Organisation Name is required" })
      .openapi({ example: "Test Organisation" }),
  })
  .openapi("Update Organisation")

export const RemoveMembersSchema = z.object({
  userIds: z
    .array(z.string().min(1, "Invalid ID"))
    .min(1, "Atleast 1 Item is required"),
})

export const PermissionsResponseSchema = z
  .object({
    canCreateProject: z.boolean(),
    canCreateWorkspace: z.boolean(),
  })
  .openapi("PermissionsResponse")
