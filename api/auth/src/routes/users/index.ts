import { invalidateAllSessions } from "@/auth/session"
import { hashPassword } from "@/auth/utils"
import { findUserById } from "@/lib/db"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import {
  ERROR_CASL_FORBIDDEN,
  ERROR_UNAUTHORIZED,
  createKyselyFilter,
  parseQueryParams,
} from "@incmix-api/utils"
import {
  ForbiddenError,
  ServerError,
  UnauthorizedError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { ExpressionWrapper, OrderByExpression, SqlBool } from "kysely"
import { getAllUsers, setEnabled, setPassword, setVerified } from "./openapi"

import {
  ERROR_NO_PP,
  ERROR_PP_DELETE_FAIL,
  ERROR_PRESIGNED_URL,
  ERROR_UPLOAD_FAIL,
  ERROR_USER_DEL_FAILED,
  ERROR_USER_NOT_FOUND,
  USER_DEL,
} from "@/lib/constants"
import { ERROR_FORBIDDEN } from "@incmix-api/utils"
import {
  type Database,
  type UserProfileColumns,
  userProfileColumns,
} from "@incmix-api/utils/db-schema"
import { NotFoundError } from "@incmix-api/utils/errors"
import { sql } from "kysely"
import { envVars } from "../../env-vars"
import {
  addProfilePicture,
  deleteProfilePicture,
  getProfilePicture,
  updateUser,
  userOnboarding,
} from "./openapi"
import type { OnboardingResponse } from "./types"

const usersRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

usersRoutes.openapi(userOnboarding, async (c) => {
  try {
    const {
      email,
      companyName,
      companySize,
      teamSize,
      purpose,
      role,
      manageFirst,
      focusFirst,
      referralSources,
    } = c.req.valid("json")

    const t = await useTranslation(c)

    console.log("Received referralSources:", referralSources)
    console.log("Type:", typeof referralSources)

    let normalizedSources: string[] = []

    if (referralSources) {
      if (Array.isArray(referralSources)) {
        normalizedSources = referralSources.map((item) => String(item))
      } else if (typeof referralSources === "string") {
        try {
          const parsed = JSON.parse(referralSources)
          normalizedSources = Array.isArray(parsed)
            ? parsed.map(String)
            : [referralSources]
        } catch {
          normalizedSources = [referralSources]
        }
      } else if (typeof referralSources === "object") {
        normalizedSources = Object.keys(referralSources)
      }
    }

    console.log("Normalized sources:", normalizedSources)

    const existingProfile = await c
      .get("db")
      .selectFrom("userProfiles")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst()

    if (!existingProfile) {
      const msg = await t.text(ERROR_USER_NOT_FOUND)
      throw new NotFoundError(msg)
    }

    console.log(
      "Existing profile referralSources type:",
      typeof existingProfile.referralSources
    )
    console.log("Existing value:", existingProfile.referralSources)

    const updatedProfile = await c
      .get("db")
      .updateTable("userProfiles")
      .set({
        id: existingProfile.id,
        companyName,
        companySize,
        teamSize,
        purpose,
        role,
        manageFirst,
        focusFirst,

        referralSources: sql`CAST(${JSON.stringify(normalizedSources)} AS JSONB)`,
        onboardingCompleted: true,
      })
      .where("email", "=", email)
      .returningAll()
      .executeTakeFirstOrThrow()

    if (!updatedProfile) {
      throw new ServerError("Failed to create Profile")
    }

    const response: OnboardingResponse = {
      email: updatedProfile.email,
      companyName: updatedProfile.companyName,
      companySize: updatedProfile.companySize,
      teamSize: updatedProfile.teamSize,
      purpose: updatedProfile.purpose,
      role: updatedProfile.role,
      manageFirst: updatedProfile.manageFirst,
      focusFirst: updatedProfile.focusFirst,
      referralSources: updatedProfile.referralSources,
    }

    return c.json(response, 200)
  } catch (error) {
    console.error("Full error:", error)
    return await processError<typeof userOnboarding>(c, error, [
      "{{ default }}",
      "user-onboarding",
    ])
  }
})

usersRoutes.openapi(getAllUsers, async (c) => {
  try {
    const t = await useTranslation(c)
    const user = c.get("user")
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    if (!user.isSuperAdmin) {
      const msg = await t.text(ERROR_CASL_FORBIDDEN, {
        action: "read",
        role: "Member",
      })
      throw new ForbiddenError(msg)
    }

    const queryParams = c.req.query()

    const { filters, sort, pagination, joinOperator } =
      parseQueryParams<UserProfileColumns>(queryParams, userProfileColumns)

    let query = c
      .get("db")
      .selectFrom("userProfiles")
      .innerJoin("users", "userProfiles.id", "users.id")
      .leftJoin("accounts", "users.id", "accounts.userId")
      .select([
        "userProfiles.id",
        "userProfiles.fullName as name",
        "userProfiles.email",
        "userProfiles.avatar",
        "userProfiles.localeId",
        "users.emailVerifiedAt as verified",
        "users.isActive as enabled",
        "accounts.provider as oauth",
        "userProfiles.profileImage",
      ])

    if (filters.length)
      query = query.where(({ eb, and, or }) => {
        const expressions: ExpressionWrapper<
          Database,
          "userProfiles",
          string | SqlBool | null | number
        >[] = []

        for (const filter of filters) {
          const kf = createKyselyFilter<
            UserProfileColumns,
            Database,
            "userProfiles"
          >(filter, eb)
          if (kf) expressions.push(kf)
        }

        // @ts-expect-error Type issue, fix WIP
        if (joinOperator === "or") return or(expressions)
        // @ts-expect-error Type issue, fix WIP
        return and(expressions)
      })

    if (sort.length) {
      query = query.orderBy(
        sort.map((s) => {
          const field = s.id
          const order = s.desc ? "desc" : "asc"
          const expression: OrderByExpression<
            Database,
            "userProfiles",
            typeof order
          > = `${field} ${order}`

          return expression
        })
      )
    }

    const total = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst()

    // Parse the count as a number to ensure proper type
    const totalCount = Number(total?.count ?? 0)

    if (pagination) {
      query = query.limit(pagination.pageSize)
      if (pagination.page && pagination.page > 1) {
        query = query.offset((pagination.page - 1) * pagination.pageSize)
      }
    }

    const profiles = await query.execute()

    const totalPages = Math.ceil(totalCount / (pagination?.pageSize ?? 10))

    const hasNextPage = totalPages > (pagination?.page ?? 1)
    const hasPrevPage = (pagination?.page ?? 1) > 1

    return c.json(
      {
        data: profiles.map((p) => ({
          ...p,
          localeId: p.localeId || 1,
          verified: Boolean(p.verified),
          enabled: Boolean(p.enabled),
        })),
        pagination: {
          page: pagination?.page ?? 1,
          limit: pagination?.pageSize ?? 10,
          total: totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
      200
    )
  } catch (error) {
    return await processError<typeof getAllUsers>(c, error, [
      "{{ default }}",
      "get-all-users",
    ])
  }
})

usersRoutes.openapi(updateUser, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { id } = c.req.valid("query")

    // Use provided id or default to authenticated user's id
    const targetId = id ?? user.id

    if (user.id !== targetId && !user.isSuperAdmin) {
      const msg = await t.text(ERROR_FORBIDDEN)
      throw new ForbiddenError(msg)
    }

    const profile = await c
      .get("db")
      .selectFrom("userProfiles")
      .selectAll()
      .where("id", "=", targetId)
      .executeTakeFirst()

    if (!profile) {
      const msg = await t.text(ERROR_USER_NOT_FOUND)
      throw new NotFoundError(msg)
    }

    const { fullName } = c.req.valid("json")
    const updatedProfile = await c
      .get("db")
      .updateTable("userProfiles")
      .set({ fullName })
      .where("id", "=", targetId)
      .returningAll()
      .executeTakeFirst()

    return c.json(updatedProfile, 200)
  } catch (error) {
    return await processError<typeof updateUser>(c, error, [
      "{{ default }}",
      "update-user",
    ])
  }
})

usersRoutes.openapi(addProfilePicture, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { id } = c.req.valid("query")

    // Use provided id or default to authenticated user's id
    const targetId = id ?? user.id

    if (user.id !== targetId && !user.isSuperAdmin) {
      const msg = await t.text(ERROR_FORBIDDEN)
      throw new ForbiddenError(msg)
    }

    const profile = await c
      .get("db")
      .selectFrom("userProfiles")
      .selectAll()
      .where("id", "=", targetId)
      .executeTakeFirst()

    if (!profile) {
      const msg = await t.text(ERROR_USER_NOT_FOUND)
      throw new NotFoundError(msg)
    }
    const { file } = c.req.valid("form")

    const fileName = `profile_image/${targetId}.jpg`
    const presignedUrlResponse = await fetch(
      `${envVars.FILES_API_URL}/presigned-upload?fileName=${encodeURIComponent(fileName)}`,
      {
        method: "GET",
        headers: c.req.raw.headers,
      }
    )

    if (!presignedUrlResponse.ok) {
      const msg = await t.text(ERROR_PRESIGNED_URL, {
        status: presignedUrlResponse.status,
        text: await presignedUrlResponse.text(),
      })
      throw new ServerError(msg)
    }
    const presignedData = (await presignedUrlResponse.json()) as { url: string }
    const presignedUrl = presignedData.url

    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        Cookie: c.req.header("Cookie") || "",
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      const msg = await t.text(ERROR_UPLOAD_FAIL)
      throw new ServerError(msg)
    }

    const updatedProfile = await c
      .get("db")
      .updateTable("userProfiles")
      .set({ profileImage: fileName })
      .where("id", "=", profile.id)
      .returningAll()
      .executeTakeFirst()

    if (!updatedProfile) {
      const msg = await t.text(ERROR_UPLOAD_FAIL)
      throw new ServerError(msg)
    }
    return c.json(
      {
        ...updatedProfile,
        name: updatedProfile.fullName,
        localeId: updatedProfile.localeId || 1,
      },
      200
    )
  } catch (error) {
    return await processError<typeof addProfilePicture>(c, error, [
      "{{ default }}",
      "add-profile-picture",
    ])
  }
})

usersRoutes.openapi(deleteProfilePicture, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { id } = c.req.valid("query")

    // Use provided id or default to authenticated user's id
    const targetId = id ?? user.id

    if (user.id !== targetId && !user.isSuperAdmin) {
      const msg = await t.text(ERROR_FORBIDDEN)
      throw new ForbiddenError(msg)
    }

    const profile = await c
      .get("db")
      .selectFrom("userProfiles")
      .selectAll()
      .where("id", "=", targetId)
      .executeTakeFirst()

    if (!profile) {
      const msg = await t.text(ERROR_USER_NOT_FOUND)
      throw new NotFoundError(msg)
    }

    if (!profile.profileImage) {
      const msg = await t.text(ERROR_NO_PP)
      throw new NotFoundError(msg)
    }

    const presignedUrlResponse = await fetch(
      `${envVars.FILES_API_URL}/presigned-delete?fileName=${encodeURIComponent(
        profile.profileImage
      )}`,
      {
        method: "GET",
        headers: {
          ...c.req.header(),
        },
      }
    )

    if (!presignedUrlResponse.ok) {
      const msg = await t.text(ERROR_PRESIGNED_URL, {
        status: presignedUrlResponse.status,
        text: await presignedUrlResponse.text(),
      })
      throw new ServerError(msg)
    }

    const presignedData = (await presignedUrlResponse.json()) as { url: string }
    const presignedUrl = presignedData.url

    const deleteResponse = await fetch(presignedUrl, {
      method: "DELETE",
      headers: {
        Cookie: c.req.header("Cookie") || "",
      },
    })
    if (!deleteResponse.ok) {
      const msg = await t.text(ERROR_PP_DELETE_FAIL)
      throw new ServerError(msg)
    }

    // Update user's profile_image in D1
    const updatedProfile = await c
      .get("db")
      .updateTable("userProfiles")
      .set({ profileImage: null })
      .where("id", "=", profile.id)
      .returningAll()
      .executeTakeFirst()

    if (!updatedProfile) {
      const msg = await t.text(ERROR_PP_DELETE_FAIL)
      throw new ServerError(msg)
    }
    return c.json(
      {
        ...updatedProfile,
        name: updatedProfile.fullName,
        localeId: updatedProfile.localeId || 1,
      },
      200
    )
  } catch (error) {
    return await processError<typeof deleteProfilePicture>(c, error, [
      "{{ default }}",
      "delete-profile-picture",
    ])
  }
})

usersRoutes.openapi(getProfilePicture, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { id } = c.req.valid("query")

    // Use provided id or default to authenticated user's id
    const targetId = id ?? user.id

    const profile = await c
      .get("db")
      .selectFrom("userProfiles")
      .selectAll()
      .where("id", "=", targetId)
      .executeTakeFirst()

    if (!profile) {
      const msg = await t.text(ERROR_USER_NOT_FOUND)
      throw new NotFoundError(msg)
    }

    if (!profile.profileImage) {
      return c.json({ url: null }, 200)
    }

    const presignedUrlResponse = await fetch(
      `${envVars.FILES_API_URL}/presigned-download?fileName=${encodeURIComponent(
        profile.profileImage
      )}`,
      {
        method: "GET",
        headers: {
          ...c.req.header(),
        },
      }
    )

    if (!presignedUrlResponse.ok) {
      const msg = await t.text(ERROR_PRESIGNED_URL, {
        status: presignedUrlResponse.status,
        text: await presignedUrlResponse.text(),
      })
      throw new ServerError(msg)
    }

    const urlData = (await presignedUrlResponse.json()) as { url: string }
    const url = urlData.url

    return c.json({ url }, 200)
  } catch (error) {
    return await processError<typeof getProfilePicture>(c, error, [
      "{{ default }}",
      "get-profile-picture",
    ])
  }
})

usersRoutes.openapi(setVerified, async (c) => {
  try {
    const t = await useTranslation(c)
    const user = c.get("user")
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    if (!user.isSuperAdmin) {
      const msg = await t.text(ERROR_CASL_FORBIDDEN, {
        action: "read",
        role: "Member",
      })
      throw new ForbiddenError(msg)
    }

    const { value, id } = c.req.valid("json")

    const u = await findUserById(c, id)

    if (id === user.id) {
      throw new ForbiddenError("Cannot update own account")
    }

    const updated = await c
      .get("db")
      .updateTable("users")
      .set("emailVerifiedAt", value ? new Date().toISOString() : null)
      .where("id", "=", u.id)
      .returningAll()
      .executeTakeFirst()

    if (!updated) {
      throw new ServerError("Failed to updated User")
    }

    // Logout users everywhere
    await invalidateAllSessions(c.get("db"), updated.id)

    return c.json({ message: "Updated Successfully" }, 200)
  } catch (error) {
    return await processError<typeof setVerified>(c, error, [
      "{{ default }}",
      "setVerified",
    ])
  }
})

usersRoutes.openapi(setEnabled, async (c) => {
  try {
    const t = await useTranslation(c)
    const user = c.get("user")
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    if (!user.isSuperAdmin) {
      const msg = await t.text(ERROR_CASL_FORBIDDEN, {
        action: "read",
        role: "Member",
      })
      throw new ForbiddenError(msg)
    }

    const { value, id } = c.req.valid("json")

    const u = await findUserById(c, id)

    if (id === user.id) {
      throw new ForbiddenError("Cannot update own account")
    }

    const updated = await c
      .get("db")
      .updateTable("users")
      .set("isActive", value)
      .where("id", "=", u.id)
      .returningAll()
      .executeTakeFirst()

    if (!updated) {
      throw new ServerError("Failed to updated User")
    }

    // Logout users everywhere
    await invalidateAllSessions(c.get("db"), updated.id)

    return c.json({ message: "Updated Successfully" }, 200)
  } catch (error) {
    return await processError<typeof setVerified>(c, error, [
      "{{ default }}",
      "setVerified",
    ])
  }
})
usersRoutes.openapi(setPassword, async (c) => {
  try {
    const t = await useTranslation(c)
    const user = c.get("user")
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    if (!user.isSuperAdmin) {
      const msg = await t.text(ERROR_CASL_FORBIDDEN, {
        action: "read",
        role: "Member",
      })
      throw new ForbiddenError(msg)
    }

    const { value, id } = c.req.valid("json")

    const u = await findUserById(c, id)

    if (id === user.id) {
      throw new ForbiddenError("Cannot update own account")
    }

    const newHash = await hashPassword(value)

    const updated = await c
      .get("db")
      .updateTable("users")
      .set("hashedPassword", newHash)
      .where("id", "=", u.id)
      .returningAll()
      .executeTakeFirst()

    if (!updated) {
      throw new ServerError("Failed to updated User")
    }

    // Logout users everywhere
    await invalidateAllSessions(c.get("db"), updated.id)

    return c.json({ message: "Updated Successfully" }, 200)
  } catch (error) {
    return await processError<typeof setVerified>(c, error, [
      "{{ default }}",
      "setVerified",
    ])
  }
})

export default usersRoutes
