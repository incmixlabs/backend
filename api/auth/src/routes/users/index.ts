import { useFastifyTranslation } from "@incmix-api/utils/fastify-bootstrap"
import type { FastifyInstance } from "fastify"
import { invalidateAllSessions } from "@/auth/session"
import { envVars } from "@/env-vars"
import {
  ERROR_PRESIGNED_URL,
  ERROR_UPLOAD_FAIL,
  ERROR_USER_NOT_FOUND,
} from "@/lib/constants"
import { authMiddleware } from "@/middleware/auth"

export const setupUsersRoutes = (app: FastifyInstance) => {
  // Get user by ID or email
  app.get(
    "/users",
    {
      schema: {
        summary: "Get user",
        description: "Get user by ID or email",
        tags: ["users"],
        querystring: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "User's unique identifier",
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
            },
          },
        },
        response: {
          200: {
            description: "Successfully retrieved user information",
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "User's unique identifier",
              },
              fullName: {
                type: "string",
                description: "User's full name",
              },
              email: {
                type: "string",
                format: "email",
                description: "User's email address",
              },
              emailVerified: {
                type: "boolean",
                description: "Whether the user's email has been verified",
              },
              isSuperAdmin: {
                type: "boolean",
                description: "Whether the user has super admin privileges",
              },
            },
          },
          400: {
            description: "Bad request - Missing required query parameter",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
          404: {
            description: "User not found",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id, email } = request.query as { id?: string; email?: string }

        if (!request.context?.db) {
          throw new Error("Database not available")
        }

        if (!id && !email) {
          return reply
            .status(400)
            .send({ message: "Either id or email is required" })
        }

        let query = request.context.db
          .selectFrom("users")
          .innerJoin("userProfiles", "users.id", "userProfiles.id")
          .select([
            "users.id",
            "users.email",
            "users.isSuperAdmin",
            "users.emailVerifiedAt",
            "userProfiles.fullName",
            "userProfiles.avatar",
            "userProfiles.profileImage",
            "userProfiles.localeId",
            "userProfiles.onboardingCompleted",
          ])

        if (id) {
          query = query.where("users.id", "=", id)
        } else if (email) {
          query = query.where("users.email", "=", email)
        }

        const searchedUser = await query.executeTakeFirst()

        if (!searchedUser) {
          return reply.code(404).send({ message: "User not found" })
        }

        return {
          id: searchedUser.id,
          fullName: searchedUser.fullName,
          avatar: searchedUser.avatar,
          profileImage: searchedUser.profileImage,
          localeId: searchedUser.localeId,
          onboardingCompleted: searchedUser.onboardingCompleted,
          isSuperAdmin: searchedUser.isSuperAdmin,
          email: searchedUser.email,
          emailVerified: !!searchedUser.emailVerifiedAt,
        }
      } catch (error) {
        console.error("Get user error:", error)
        throw error
      }
    }
  )
  // Get all users (admin only)
  app.get(
    "/users/list",
    {
      schema: {
        summary: "Get all users",
        description: "Get all users (superadmin only)",
        tags: ["users"],
        response: {
          200: {
            type: "object",
            properties: {
              results: {
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
              pagination: {
                type: "object",
                properties: {
                  page: { type: "number" },
                  limit: { type: "number" },
                  total: { type: "number" },
                  totalPages: { type: "number" },
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

        return reply.status(200).send({
          results: data,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
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
        summary: "Update user profile",
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
    "/setVerified",
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
    "/setEnabled",
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
    "/setPassword",
    {
      schema: {
        summary: "Set user password",
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
  // This route now accepts multipart form data for profile picture upload.
  // Make sure @fastify/multipart is registered in your Fastify instance.
  app.put(
    "/users/profile-picture",
    {
      schema: {
        summary: "Add or update profile picture",
        description: "Add or update profile picture (multipart/form-data)",
        tags: ["users"],
        consumes: ["multipart/form-data"],
        // Remove body schema for multipart requests as Fastify handles this differently
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              fullName: { type: "string" },
              email: { type: "string" },
              emailVerified: { type: "boolean" },
              isSuperAdmin: { type: "boolean" },
              profileImage: { type: "string" },
              localeId: { type: "number" },
              name: { type: "string" },
            },
          },
          401: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          500: {
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

        // Get user profile first
        const profile = await db
          .selectFrom("userProfiles")
          .selectAll()
          .where("id", "=", userId)
          .executeTakeFirst()

        if (!profile) {
          const t = await useFastifyTranslation(request)
          const msg = await t.text(ERROR_USER_NOT_FOUND)
          return reply.status(404).send({ message: msg })
        }

        // Get the file from multipart form data
        const file = await request.file()

        if (!file) {
          return reply.status(400).send({ message: "No file uploaded" })
        }

        // Generate filename
        const fileName = `profile_image/${userId}.jpg`

        // Get presigned URL from files API
        const filesApiUrl = envVars.FILES_API_URL
        if (!filesApiUrl) {
          return reply
            .status(500)
            .send({ message: "Files API URL not configured" })
        }

        const presignedUrlResponse = await fetch(
          `${filesApiUrl}/presigned-upload?fileName=${encodeURIComponent(fileName)}`,
          {
            method: "GET",
            headers: request.headers,
          }
        )

        if (!presignedUrlResponse.ok) {
          const errorText = await presignedUrlResponse.text()
          console.error(
            "Presigned URL error:",
            presignedUrlResponse.status,
            errorText
          )
          const t = await useFastifyTranslation(request)
          const msg = await t.text(ERROR_PRESIGNED_URL, {
            status: presignedUrlResponse.status,
            text: errorText,
          })
          return reply.status(500).send({ message: msg })
        }

        const presignedData = (await presignedUrlResponse.json()) as {
          url: string
        }
        const presignedUrl = presignedData.url
        // Get file size for Content-Length header
        const fileBuffer = await file.toBuffer()

        // Upload file to presigned URL
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.mimetype || "image/jpeg",
            "Content-Length": fileBuffer.length.toString(),
            Cookie: request.headers.cookie || "",
          },
          body: fileBuffer,
          duplex: "half",
        } as RequestInit & { duplex: "half" })

        if (!uploadResponse.ok) {
          console.error(
            "Upload failed:",
            uploadResponse.status,
            await uploadResponse.text()
          )
          const t = await useFastifyTranslation(request)
          const msg = await t.text(ERROR_UPLOAD_FAIL)
          return reply.status(500).send({ message: msg })
        }

        // Update profile with image filename
        const updatedProfile = await db
          .updateTable("userProfiles")
          .set({ profileImage: fileName })
          .where("id", "=", profile.id)
          .returningAll()
          .executeTakeFirst()

        if (!updatedProfile) {
          const t = await useFastifyTranslation(request)
          const msg = await t.text(ERROR_UPLOAD_FAIL)
          return reply.status(500).send({ message: msg })
        }

        // Get user data for response
        const user = await db
          .selectFrom("users")
          .select(["email", "emailVerifiedAt", "isSuperAdmin"])
          .where("id", "=", userId)
          .executeTakeFirst()

        return reply.status(200).send({
          ...updatedProfile,
          name: updatedProfile.fullName,
          localeId: updatedProfile.localeId || 1,
          email: user?.email || "",
          emailVerified: !!user?.emailVerifiedAt,
          isSuperAdmin: user?.isSuperAdmin || false,
        })
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
        summary: "Get profile picture URL",
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
        const profileImageUrl =
          `${envVars.S3_FILE_URL}/${profile.profileImage}` || null

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
        summary: "Delete profile picture",
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
