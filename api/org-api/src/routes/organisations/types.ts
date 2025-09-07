import { USER_ROLES, UserRoles } from "@incmix/utils/types"
import { z } from "zod"

export const MemberSchema = z.object({
  userId: z.string(),
  role: z.string(),
})

export const MemberEmailSchema = z.object({
  email: z.string().email("Invalid Email"),
  role: z.enum(USER_ROLES).default(UserRoles.ROLE_VIEWER),
})

export const OrgSchema = z.object({
  id: z.string({ message: "Id is Required" }),
  name: z.string({ message: "Organisation Name is required" }),
  handle: z.string({ message: "Organisation Handle is required" }),
  members: z.array(MemberSchema),
})

export const OrgHandleSchema = z.object({
  handle: z.string(),
})

export const OrgIdSchema = z.object({
  id: z.string(),
})

export const SuccessSchema = z.object({
  success: z.boolean(),
})

export const CreateOrgSchema = z.object({
  name: z.string({ message: "Organisation Name is required" }),
  handle: z.string(),
  members: z.array(MemberSchema),
})

export const UpdateOrgSchema = z.object({
  name: z.string({ message: "Organisation Name is required" }),
})

export const RemoveMembersSchema = z.object({
  userIds: z
    .array(z.string().min(1, "Invalid ID"))
    .min(1, "Atleast 1 Item is required"),
})

export const MembersResponseSchema = z.array(
  z.object({
    userId: z.string(),
    fullName: z.string(),
    email: z.string(),
    profileImage: z.string().nullable(),
    avatar: z.string().nullable(),
    role: z.string(),
  })
)

export const PermissionsResponseSchema = z.array(
  z.object({
    action: z.enum(["manage", "create", "read", "update", "delete"]),
    subject: z.enum([
      "all",
      "Organisation",
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
