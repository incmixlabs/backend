import type { FastifyInstance } from "fastify"
import { invalidateAllSessions } from "@/auth/session"
import { authMiddleware } from "@/middleware/auth"

export const setupUsersRoutes = (app: FastifyInstance) => {
  // Get all users (admin only)
  app.get(
    "/users/list",
    {
      schema: {
        description: "Get all users (superadmin only)",
        tags: ["users"],
        response: {
          200: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    email: { type: "string" },
                    verified: { type: "boolean" },
                    enabled: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
      preHandler: authMiddleware,
    },
    async (request: any, reply: any) => {
      try {
        // Check if user is authenticated and is superadmin
        if (!request.user) {
          return reply.status(401).send({ message: "Unauthorized" })
        }

        if (!request.user.isSuperAdmin) {
          return reply
            .status(403)
            .send({ message: "Forbidden: Superadmin access required" })
        }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        const db = request.context.db

        // Get query parameters for filtering, sorting, and pagination
        const {
          page = 1,
          limit = 10,
          search = "",
          orderBy = "createdAt",
          order = "desc",
        } = request.query as {
          page?: number
          limit?: number
          search?: string
          orderBy?: string
          order?: "asc" | "desc"
        }
        const safeOrder = order === "asc" ? "asc" : "desc"
        const safeLimit = Math.min(Math.max(limit, 1), 100)
        const offset = (page - 1) * safeLimit

        // Build query
        let query = db
          .selectFrom("users")
          .innerJoin("userProfiles", "users.id", "userProfiles.id")
          .select([
            "users.id",
            "users.email",
            "users.emailVerifiedAt",
            "users.isActive as enabled",
            "users.isSuperAdmin",
            "userProfiles.fullName as name",
          ])

        // Add search filter if provided
        if (search) {
          query = query.where((eb: any) =>
            eb.or([
              eb("users.email", "ilike", `%${search}%`),
              eb("userProfiles.fullName", "ilike", `%${search}%`),
            ])
          )
        }

        // Get total count for pagination
        let countQuery = db
          .selectFrom("users")
          .innerJoin("userProfiles", "users.id", "userProfiles.id")
          .select((eb: any) => eb.fn.count("users.id").as("count"))

        if (search) {
          countQuery = countQuery.where((eb: any) =>
            eb.or([
              eb("users.email", "ilike", `%${search}%`),
              eb("userProfiles.fullName", "ilike", `%${search}%`),
            ])
          )
        }

        const totalResult = await countQuery.executeTakeFirst()
        const total = Number(totalResult?.count || 0)

        // Apply sorting
        if (orderBy === "email") {
          query = query.orderBy("users.email", safeOrder)
        } else if (orderBy === "name") {
          query = query.orderBy("userProfiles.fullName", safeOrder)
        } else {
          query = query.orderBy("users.id", safeOrder)
        }

        // Apply pagination
        query = query.limit(safeLimit).offset(offset)

        const users = await query.execute()

        // Format response
        const data = users.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          verified: Boolean(user.emailVerifiedAt),
          enabled: user.enabled,
          isSuperAdmin: user.isSuperAdmin,
        }))

        return {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        }
      } catch (error) {
        console.error("Get users error:", error)
        return reply.status(500).send({ message: "Internal server error" })
      }
    }
  )

  // Update user profile
  app.put(
    "/users/update",
    {
      schema: {
        description: "Update user profile",
        tags: ["users"],
        body: {
          type: "object",
          properties: {
            fullName: { type: "string", minLength: 1, maxLength: 100 },
          },
          required: ["fullName"],
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
      preHandler: authMiddleware,
    },
    async (request: any, reply: any) => {
      try {
        // Check if user is authenticated
        if (!request.user) {
          return reply.status(401).send({ message: "Unauthorized" })
        }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        const { fullName } = request.body as { fullName: string }
        const newFullName = (fullName ?? "").trim()
        if (!newFullName) {
          return reply
            .status(400)
            .send({ message: "Full name cannot be empty" })
        }

        const userId = request.user.id
        const db = request.context.db

        // Update user profile
        const result = await db
          .updateTable("userProfiles")
          .set({
            fullName: newFullName,
          })
          .where("id", "=", userId)
          .executeTakeFirst()

        if (!result || result.numUpdatedRows === 0n) {
          return reply.status(404).send({ message: "User profile not found" })
        }

        // Get updated profile
        const updatedProfile = await db
          .selectFrom("userProfiles")
          .innerJoin("users", "users.id", "userProfiles.id")
          .select([
            "userProfiles.id as id",
            "userProfiles.fullName as fullName",
            "users.email as email",
          ])
          .where("userProfiles.id", "=", userId)
          .executeTakeFirst()

        return {
          message: "Profile updated successfully",
          profile: updatedProfile,
        }
      } catch (error) {
        console.error("Update profile error:", error)
        return reply.status(500).send({ message: "Internal server error" })
      }
    }
  )

  // User onboarding
  app.post(
    "/users/onboarding",
    {
      schema: {
        description: "Complete user onboarding",
        tags: ["users"],
        body: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
            companyName: { type: "string" },
            companySize: { type: "string" },
            teamSize: { type: "string" },
            purpose: { type: "string" },
            role: { type: "string" },
          },
          required: ["email"],
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
      preHandler: authMiddleware,
    },
    async (request: any, reply: any) => {
      try {
        // Check if user is authenticated
        if (!request.user) {
          return reply.status(401).send({ message: "Unauthorized" })
        }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        const { email, companyName, companySize, teamSize, purpose, role } =
          request.body as {
            email: string
            companyName?: string
            companySize?: string
            teamSize?: string
            purpose?: string
            role?: string
          }

        const userId = request.user.id
        const db = request.context.db

        // Verify email matches authenticated user
        if (email !== request.user.email) {
          return reply
            .status(400)
            .send({ message: "Email does not match authenticated user" })
        }

        // Check if already onboarded
        const profile = await db
          .selectFrom("userProfiles")
          .select("onboardingCompleted")
          .where("id", "=", userId)
          .executeTakeFirst()

        if (!profile) {
          return reply.status(404).send({ message: "User profile not found" })
        }

        if (profile.onboardingCompleted) {
          return reply
            .status(400)
            .send({ message: "Onboarding already completed" })
        }

        // Store onboarding data (could be in a separate table or JSON field)
        // For now, we'll just mark onboarding as completed
        const result = await db
          .updateTable("userProfiles")
          .set({
            onboardingCompleted: true,
            // If there's a JSON field for onboarding data, uncomment:
            // onboardingData: JSON.stringify({
            //   companyName,
            //   companySize,
            //   teamSize,
            //   purpose,
            //   role,
            //   completedAt: new Date().toISOString(),
            // }),
          })
          .where("id", "=", userId)
          .executeTakeFirst()

        if (!result || result.numUpdatedRows === 0n) {
          return reply
            .status(500)
            .send({ message: "Failed to complete onboarding" })
        }

        return {
          message: "Onboarding completed successfully",
          data: {
            userId,
            email,
            companyName,
            companySize,
            teamSize,
            purpose,
            role,
          },
        }
      } catch (error) {
        console.error("Onboarding error:", error)
        return reply.status(500).send({ message: "Internal server error" })
      }
    }
  )

  // Set user verified status (superadmin only)
  app.put(
    "/users/setVerified",
    {
      schema: {
        description: "Set user email verification status (superadmin only)",
        tags: ["users"],
        body: {
          type: "object",
          properties: {
            userId: { type: "string" },
            verified: { type: "boolean" },
          },
          required: ["userId", "verified"],
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
      preHandler: authMiddleware,
    },
    async (request: any, reply: any) => {
      try {
        // Check if user is authenticated and is superadmin
        if (!request.user) {
          return reply.status(401).send({ message: "Unauthorized" })
        }

        if (!request.user.isSuperAdmin) {
          return reply
            .status(403)
            .send({ message: "Forbidden: Superadmin access required" })
        }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        const { userId, verified } = request.body as {
          userId: string
          verified: boolean
        }
        const db = request.context.db

        // Prevent self-modification
        if (userId === request.user.id) {
          return reply
            .status(400)
            .send({ message: "Cannot modify your own verification status" })
        }

        // Check if target user exists
        const targetUser = await db
          .selectFrom("users")
          .select(["id", "emailVerifiedAt"])
          .where("id", "=", userId)
          .executeTakeFirst()

        if (!targetUser) {
          return reply.status(404).send({ message: "User not found" })
        }

        // Update verification status
        const result = await db
          .updateTable("users")
          .set({
            emailVerifiedAt: verified ? new Date().toISOString() : null,
          })
          .where("id", "=", userId)
          .executeTakeFirst()

        if (!result || result.numUpdatedRows === 0n) {
          return reply
            .status(500)
            .send({ message: "Failed to update verification status" })
        }

        // Invalidate all user sessions if verification status changed
        if (Boolean(targetUser.emailVerifiedAt) !== verified) {
          await invalidateAllSessions(db, userId)
        }

        return {
          message: `User ${verified ? "verified" : "unverified"} successfully`,
        }
      } catch (error) {
        console.error("Set verified error:", error)
        return reply.status(500).send({ message: "Internal server error" })
      }
    }
  )

  // Set user enabled/disabled status (superadmin only)
  app.put(
    "/users/setEnabled",
    {
      schema: {
        description: "Set user enabled/disabled status (superadmin only)",
        tags: ["users"],
        body: {
          type: "object",
          properties: {
            userId: { type: "string" },
            enabled: { type: "boolean" },
          },
          required: ["userId", "enabled"],
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
      preHandler: authMiddleware,
    },
    async (request: any, reply: any) => {
      try {
        // Check if user is authenticated and is superadmin
        if (!request.user) {
          return reply.status(401).send({ message: "Unauthorized" })
        }

        if (!request.user.isSuperAdmin) {
          return reply
            .status(403)
            .send({ message: "Forbidden: Superadmin access required" })
        }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        const { userId, enabled } = request.body as {
          userId: string
          enabled: boolean
        }
        const db = request.context.db

        // Prevent self-modification
        if (userId === request.user.id) {
          return reply
            .status(400)
            .send({ message: "Cannot modify your own enabled status" })
        }

        // Check if target user exists
        const targetUser = await db
          .selectFrom("users")
          .select(["id", "isActive"])
          .where("id", "=", userId)
          .executeTakeFirst()

        if (!targetUser) {
          return reply.status(404).send({ message: "User not found" })
        }

        // Update enabled status
        const result = await db
          .updateTable("users")
          .set({
            isActive: enabled,
          })
          .where("id", "=", userId)
          .executeTakeFirst()

        if (!result || result.numUpdatedRows === 0n) {
          return reply
            .status(500)
            .send({ message: "Failed to update enabled status" })
        }

        // Invalidate all user sessions when disabled
        if (!enabled) {
          await invalidateAllSessions(db, userId)
        }

        return {
          message: `User ${enabled ? "enabled" : "disabled"} successfully`,
        }
      } catch (error) {
        console.error("Set enabled error:", error)
        return reply.status(500).send({ message: "Internal server error" })
      }
    }
  )

  // Set user password (superadmin only)
  app.put(
    "/users/setPassword",
    {
      schema: {
        description: "Set user password (superadmin only)",
        tags: ["users"],
        body: {
          type: "object",
          properties: {
            userId: { type: "string" },
            password: { type: "string", minLength: 8 },
          },
          required: ["userId", "password"],
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
      preHandler: authMiddleware,
    },
    async (request: any, reply: any) => {
      try {
        // Check if user is authenticated and is superadmin
        if (!request.user) {
          return reply.status(401).send({ message: "Unauthorized" })
        }

        if (!request.user.isSuperAdmin) {
          return reply
            .status(403)
            .send({ message: "Forbidden: Superadmin access required" })
        }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        const { userId, password } = request.body as {
          userId: string
          password: string
        }
        const db = request.context.db

        // Prevent self-modification
        if (userId === request.user.id) {
          return reply
            .status(400)
            .send({ message: "Cannot modify your own password" })
        }

        // Check if target user exists
        const targetUser = await db
          .selectFrom("users")
          .select("id")
          .where("id", "=", userId)
          .executeTakeFirst()

        if (!targetUser) {
          return reply.status(404).send({ message: "User not found" })
        }

        // Hash the new password
        const bcrypt = await import("bcrypt")
        const hashedPassword = await bcrypt.hash(password, 10)

        // Update password
        const result = await db
          .updateTable("users")
          .set({
            hashedPassword,
          })
          .where("id", "=", userId)
          .executeTakeFirst()

        if (!result || result.numUpdatedRows === 0n) {
          return reply
            .status(500)
            .send({ message: "Failed to update password" })
        }

        // Invalidate all user sessions after password change
        await invalidateAllSessions(db, userId)

        return { message: "User password updated successfully" }
      } catch (error) {
        console.error("Set password error:", error)
        return reply.status(500).send({ message: "Internal server error" })
      }
    }
  )

  // Add profile picture
  app.put(
    "/users/profile-picture",
    {
      schema: {
        description: "Add or update profile picture",
        tags: ["users"],
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
              profileImageUrl: { type: "string" },
            },
          },
        },
      },
      preHandler: authMiddleware,
    },
    async (request: any, reply: any) => {
      try {
        // Check if user is authenticated
        if (!request.user) {
          return reply.status(401).send({ message: "Unauthorized" })
        }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        const userId = request.user.id
        const db = request.context.db

        // Note: File upload handling would require multipart support
        // This is a placeholder implementation
        // In production, you would:
        // 1. Use @fastify/multipart to handle file uploads
        // 2. Validate file type and size
        // 3. Upload to S3 or other storage service
        // 4. Generate a unique filename

        // For now, we'll simulate with a placeholder URL
        const profileImageUrl = `https://storage.example.com/profiles/${userId}/avatar.jpg`

        // Update profile with image URL
        const result = await db
          .updateTable("userProfiles")
          .set({
            profileImage: profileImageUrl,
          })
          .where("id", "=", userId)
          .executeTakeFirst()

        if (!result || result.numUpdatedRows === 0n) {
          return reply
            .status(500)
            .send({ message: "Failed to update profile picture" })
        }

        return {
          message: "Profile picture updated successfully",
          profileImageUrl,
        }
      } catch (error) {
        console.error("Upload profile picture error:", error)
        return reply.status(500).send({ message: "Internal server error" })
      }
    }
  )

  // Get profile picture
  app.get(
    "/users/profile-picture",
    {
      schema: {
        description: "Get profile picture URL",
        tags: ["users"],
        response: {
          200: {
            type: "object",
            properties: {
              profileImageUrl: { type: "string", nullable: true },
            },
          },
        },
      },
      preHandler: authMiddleware,
    },
    async (request: any, reply: any) => {
      try {
        // Check if user is authenticated
        if (!request.user) {
          return reply.status(401).send({ message: "Unauthorized" })
        }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        const userId = request.user.id
        const db = request.context.db

        // Get profile image URL
        const profile = await db
          .selectFrom("userProfiles")
          .select("profileImage")
          .where("id", "=", userId)
          .executeTakeFirst()

        if (!profile) {
          return reply.status(404).send({ message: "User profile not found" })
        }

        // In production, you would generate a presigned URL here
        // if using private S3 buckets or similar
        const profileImageUrl = profile.profileImage || null

        return { profileImageUrl }
      } catch (error) {
        console.error("Get profile picture error:", error)
        return reply.status(500).send({ message: "Internal server error" })
      }
    }
  )

  // Delete profile picture
  app.delete(
    "/users/profile-picture",
    {
      schema: {
        description: "Delete profile picture",
        tags: ["users"],
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
      preHandler: authMiddleware,
    },
    async (request: any, reply: any) => {
      try {
        // Check if user is authenticated
        if (!request.user) {
          return reply.status(401).send({ message: "Unauthorized" })
        }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        const userId = request.user.id
        const db = request.context.db

        // Check if profile picture exists
        const profile = await db
          .selectFrom("userProfiles")
          .select("profileImage")
          .where("id", "=", userId)
          .executeTakeFirst()

        if (!profile) {
          return reply.status(404).send({ message: "User profile not found" })
        }

        if (!profile.profileImage) {
          return reply
            .status(400)
            .send({ message: "No profile picture to delete" })
        }

        // In production, you would also delete the file from storage service
        // await deleteFromS3(profile.profileImage)

        // Clear profile image field
        const result = await db
          .updateTable("userProfiles")
          .set({
            profileImage: null,
          })
          .where("id", "=", userId)
          .executeTakeFirst()

        if (!result || result.numUpdatedRows === 0n) {
          return reply
            .status(500)
            .send({ message: "Failed to delete profile picture" })
        }

        return { message: "Profile picture deleted successfully" }
      } catch (error) {
        console.error("Delete profile picture error:", error)
        return reply.status(500).send({ message: "Internal server error" })
      }
    }
  )
}
