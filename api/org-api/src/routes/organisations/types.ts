import { z } from "@hono/zod-openapi"
import {
  type Permission,
  USER_ROLES,
  type UserRole,
  UserRoles,
} from "@incmix/utils/types"

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
    role: z.enum(USER_ROLES).default(UserRoles.ROLE_VIEWER).openapi({
      example: UserRoles.ROLE_VIEWER,
    }),
  })
  .openapi("Member")

export const MemberEmailSchema = z
  .object({
    email: z.string().email("Invalid Email"),
    role: z
      .enum(USER_ROLES)
      .default(UserRoles.ROLE_VIEWER)
      .openapi({ example: UserRoles.ROLE_VIEWER }),
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
          role: UserRoles.ROLE_VIEWER,
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
      example: [{ userId: "93jpbulpkkavxnz", role: UserRoles.ROLE_VIEWER }],
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

export const RolesPermissionsResponseSchema = z
  .object({
    roles: z
      .object({
        name: z.string(),
        id: z.number(),
      })
      .array(),
    permissions: z
      .object({
        id: z.number(),
        action: z.string(),
        subject: z.string(),
      })
      .array(),
  })
  .openapi("RolesPermissionsResponse")

export type PermissionsWithRole = Permission & {
  [key in UserRole]: boolean
}
