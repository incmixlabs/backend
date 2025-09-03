import { z } from "@hono/zod-openapi"
import { USER_ROLES, UserRoles } from "@incmix/utils/types"

export const MemberSchema = z
  .object({
    userId: z.string().openapi({
      example: "93jpbulpkkavxnz",
    }),
    role: z.string().openapi({ example: "Owner" }),
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
      .string({ message: "Id is Required" })
      .openapi({ example: "123456886" }),
    name: z
      .string({ message: "Org Name is required" })
      .openapi({ example: "Test Org" }),
    handle: z
      .string({ message: "Org Handle is required" })
      .openapi({ example: "test-org" }),
    members: z.array(MemberSchema).openapi({
      example: [
        {
          userId: "93jpbulpkkavxnz",
          role: UserRoles.ROLE_VIEWER,
        },
      ],
    }),
  })
  .openapi("Org")

export const OrgHandleSchema = z.object({
  handle: z.string().openapi({
    example: "test-org",
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
      .string({ message: "Org Name is required" })
      .openapi({ example: "Test Org" }),
    handle: z.string().openapi({
      example: "test-org",
    }),
    members: z.array(MemberSchema).openapi({
      example: [{ userId: "93jpbulpkkavxnz", role: UserRoles.ROLE_VIEWER }],
    }),
  })
  .openapi("Create Org")

export const UpdateOrgSchema = z
  .object({
    name: z
      .string({ message: "Org Name is required" })
      .openapi({ example: "Test Org" }),
  })
  .openapi("Update Org")

export const RemoveMembersSchema = z.object({
  userIds: z
    .array(z.string().min(1, "Invalid ID"))
    .min(1, "Atleast 1 Item is required"),
})

export const MembersResponseSchema = z
  .array(
    z.object({
      userId: z.string(),
      fullName: z.string(),
      email: z.string(),
      profileImage: z.string().nullable(),
      avatar: z.string().nullable(),
      role: z.string(),
    })
  )
  .openapi("MembersResponse")

export const PermissionsResponseSchema = z
  .array(
    z.object({
      action: z.enum(["manage", "create", "read", "update", "delete"]),
      subject: z.enum([
        "all",
        "Org",
        "Member",
        "Project",
        "Task",
        "Comment",
        "Document",
        "Folder",
        "File",
        "ProjectMember",
        "Role",
        "Permission",
      ]),
      conditions: z.any().optional(),
    })
  )
  .openapi("PermissionsResponse")
