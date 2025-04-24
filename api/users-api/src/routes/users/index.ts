import {
  ERROR_NO_PP,
  ERROR_PP_DELETE_FAIL,
  ERROR_PRESIGNED_URL,
  ERROR_UPLOAD_FAIL,
  ERROR_USER_DEL_FAILED,
  ERROR_USER_NOT_FOUND,
  USER_DEL,
} from "@/lib/constants"
import type { HonoApp } from "@/types"
import { OpenAPIHono, type z } from "@hono/zod-openapi"
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"

import {
  type Database,
  type UserProfileColumn,
  type UserProfileTable,
  columns,
} from "@/dbSchema"

import { adminPermissions, userPermissions } from "@/lib/casl"
import { db } from "@/lib/db"
import {
  ERROR_CASL_FORBIDDEN,
  ERROR_FORBIDDEN,
  ERROR_UNAUTHORIZED,
  createKyselyFilter,
  parseQueryParams,
} from "@incmix-api/utils"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { Filter } from "@incmix/utils/data-table"
import type {
  PaginatedUser,
  Permission,
  UserAndProfile,
  presignedUrlSchema,
} from "@incmix/utils/types"

import { envVars } from "@/env-vars"
import { UserRoles } from "@incmix/utils/types"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import type { ExpressionWrapper, OrderByExpression, SqlBool } from "kysely"
import {
  addProfilePicture,
  createUserProfile,
  deleteProfilePicture,
  deleteUser,
  getAllUsers,
  getCurrentUser,
  getProfilePicture,
  getUser,
  getUserpermissions,
  updateUser,
  userOnboarding,
} from "./openapi"

const userRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

userRoutes.openapi(createUserProfile, async (c) => {
  try {
    const { id, email, name, localeId } = c.req.valid("json")

    const existingProfile = await db
      .selectFrom("userProfiles")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst()

    if (existingProfile) {
      const updatedProfile = await db
        .updateTable("userProfiles")
        .set({
          id: existingProfile.id,
          fullName: name,
          localeId,
          onboardingCompleted: false,
        })
        .where("email", "=", email)
        .returningAll()
        .executeTakeFirstOrThrow()

      if (!updatedProfile) {
        throw new ServerError("Failed to create Profile")
      }

      return c.json({ ...updatedProfile, name: updatedProfile.fullName }, 201)
    }

    const newProfile = await db
      .insertInto("userProfiles")
      .values({
        id,
        email,
        fullName: name,
        localeId,
        onboardingCompleted: false,
        companyName: "",
        companySize: "",
        teamSize: "",
        purpose: "",
        role: "",
        manageFirst: "",
        focusFirst: "",
        referralSources: [],
      })
      .returningAll()
      .executeTakeFirst()

    if (!newProfile) {
      throw new ServerError("Failed to create Profile")
    }

    return c.json({ ...newProfile, name: newProfile.fullName }, 201)
  } catch (error) {
    return await processError<typeof createUserProfile>(c, error, [
      "{{ default }}",
      "create-user-profile",
    ])
  }
})
userRoutes.openapi(userOnboarding, async (c) => {
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

    const existingProfile = await db
      .selectFrom("userProfiles")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst()

    if (!existingProfile) {
      const msg = await t.text(ERROR_USER_NOT_FOUND)
      throw new NotFoundError(msg)
    }

    const updatedProfile = await db
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
        referralSources,
        onboardingCompleted: true,
      })
      .where("email", "=", email)
      .returningAll()
      .executeTakeFirstOrThrow()

    if (!updatedProfile) {
      throw new ServerError("Failed to create Profile")
    }

    return c.json({ ...updatedProfile, name: updatedProfile.fullName }, 200)
  } catch (error) {
    return await processError<typeof userOnboarding>(c, error, [
      "{{ default }}",
      "user-onboarding",
    ])
  }
})

userRoutes.openapi(getCurrentUser, async (c) => {
  try {
    const user = c.get("user")
    if (!user) {
      throw new UnauthorizedError()
    }

    const profile = await db
      .selectFrom("userProfiles")
      .selectAll()
      .where("id", "=", user.id)
      .executeTakeFirst()

    if (!profile) {
      throw new NotFoundError("user not found")
    }
    return c.json({ ...profile, name: profile.fullName }, 200)
  } catch (error) {
    return await processError<typeof getUser>(c, error, [
      "{{ default }}",
      "get-user",
    ])
  }
})

userRoutes.openapi(getUser, async (c) => {
  try {
    const user = c.get("user")
    if (!user) {
      throw new UnauthorizedError()
    }

    const { id, email } = c.req.valid("query")

    let query = db.selectFrom("userProfiles").selectAll()

    if (id?.length) {
      query = query.where("id", "=", id)
    } else if (email?.length) {
      query = query.where("email", "=", email)
    }

    const profile = await query.executeTakeFirst()

    if (!profile) {
      throw new NotFoundError("user not found")
    }

    return c.json({ ...profile, name: profile.fullName }, 200)
  } catch (error) {
    return await processError<typeof getUser>(c, error, [
      "{{ default }}",
      "get-user",
    ])
  }
})

//@ts-expect-error type error due to dynamic status code
userRoutes.openapi(getUserpermissions, async (c) => {
  try {
    const t = await useTranslation(c)
    const user = c.get("user")
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    if (user.userType === UserRoles.ROLE_SUPER_ADMIN) {
      return c.json(adminPermissions, 200)
    }
    if (user.userType === UserRoles.ROLE_MEMBER) {
      const { orgId } = c.req.valid("query")
      if (!orgId) throw new BadRequestError("orgId is required")
      const url = `${c.env.ORG_URL}/${orgId}/permissions`
      const cookie = c.req.header("Cookie") || ""
      const res = await fetch(url, {
        headers: { cookie },
      })
      if (!res.ok) {
        const error = (await res.json()) as { message: string }

        return c.json(
          { message: error.message },
          res.status as ContentfulStatusCode
        )
      }

      const permissions = (await res.json()) as Permission[]
      return c.json(permissions, 200)
    }

    return c.json(userPermissions(user.id), 200)
  } catch (error) {
    return await processError<typeof getUserpermissions>(c, error, [
      "{{ default }}",
      "get-user-permissions",
    ])
  }
})

userRoutes.openapi(getAllUsers, async (c) => {
  try {
    const t = await useTranslation(c)
    const user = c.get("user")
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    if (user.userType !== UserRoles.ROLE_SUPER_ADMIN) {
      const msg = await t.text(ERROR_CASL_FORBIDDEN, {
        action: "read",
        role: user.userType,
      })
      throw new ForbiddenError(msg)
    }

    const queryParams = c.req.query()

    const { filters, sort, pagination, joinOperator } =
      parseQueryParams<UserProfileColumn>(queryParams, columns)

    let query = db.selectFrom("userProfiles").selectAll()

    if (filters.length)
      query = query.where(({ eb, and, or }) => {
        const expressions: ExpressionWrapper<
          Database,
          "userProfiles",
          string | SqlBool | null | number
        >[] = []

        for (const filter of filters) {
          const kf = createKyselyFilter<
            UserProfileColumn,
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
          const field = s.id as keyof UserProfileTable
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
      .groupBy("id")
      .executeTakeFirst()

    if (pagination) {
      query = query.limit(pagination.pageSize)
      if (pagination.page && pagination.page > 1) {
        query = query.offset((pagination.page - 1) * pagination.pageSize)
      }
    }

    const profiles = await query.execute()

    const usersFilter: Filter<UserProfileColumn>[] = [
      {
        id: "id",
        value: profiles.map((p) => p.id),
        operator: "eq",
        type: "text",
        rowId: "users",
      },
    ]
    const searchParams = new URLSearchParams({
      filters: JSON.stringify(usersFilter),
      pageSize: String(pagination.pageSize),
    })

    const { results } = await fetch(
      `${envVars.AUTH_URL}/users/getAll?${searchParams.toString()}`,
      {
        method: "get",
        headers: c.req.raw.headers,
      }
    ).then(async (res) => (await res.json()) as PaginatedUser)

    const combinedData = profiles.map<UserAndProfile>((p) => {
      const user = results.find((u) => u.id === p.id)
      if (!user) throw new ServerError("Failed to fetch Data")

      return {
        ...p,
        ...user,
        name: p.fullName,
      }
    })

    const totalPages = Math.ceil(
      (total?.count ?? 1) / (pagination?.pageSize ?? 10)
    )

    const hasNextPage = totalPages > (pagination?.page ?? 1)
    const hasPrevPage = (pagination?.page ?? 1) > 1

    return c.json(
      {
        results: combinedData,
        metadata: {
          page: pagination?.page ?? 1,
          pageSize: pagination?.pageSize ?? 10,
          total: total?.count ?? 0,
          pageCount: totalPages,
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

userRoutes.openapi(deleteUser, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { id } = c.req.valid("param")

    if (user.id !== id && user.userType !== UserRoles.ROLE_SUPER_ADMIN) {
      const msg = await t.text(ERROR_FORBIDDEN)
      throw new ForbiddenError(msg)
    }

    const profile = await db
      .selectFrom("userProfiles")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst()

    if (!profile) {
      const msg = await t.text(ERROR_USER_NOT_FOUND)
      throw new NotFoundError(msg)
    }

    const { numDeletedRows } = await db
      .deleteFrom("userProfiles")
      .where("id", "=", profile.id)
      .executeTakeFirst()

    if (numDeletedRows < 1) {
      const msg = await t.text(ERROR_USER_DEL_FAILED)
      throw new ServerError(msg)
    }
    const msg = await t.text(USER_DEL)
    return c.json({ message: msg }, 200)
  } catch (error) {
    return await processError<typeof deleteUser>(c, error, [
      "{{ default }}",
      "delete-user",
    ])
  }
})

userRoutes.openapi(updateUser, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { id } = c.req.valid("param")
    if (user.id !== id && user.userType !== UserRoles.ROLE_SUPER_ADMIN) {
      const msg = await t.text(ERROR_FORBIDDEN)
      throw new ForbiddenError(msg)
    }

    const profile = await db
      .selectFrom("userProfiles")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst()

    if (!profile) {
      const msg = await t.text(ERROR_USER_NOT_FOUND)
      throw new NotFoundError(msg)
    }

    const { fullName } = c.req.valid("json")
    const updatedProfile = await db
      .updateTable("userProfiles")
      .set({ fullName })
      .where("id", "=", profile.id)
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

userRoutes.openapi(addProfilePicture, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { id } = c.req.valid("param")

    if (user.id !== id && user.userType !== UserRoles.ROLE_SUPER_ADMIN) {
      const msg = await t.text(ERROR_FORBIDDEN)
      throw new ForbiddenError(msg)
    }

    const profile = await db
      .selectFrom("userProfiles")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst()

    if (!profile) {
      const msg = await t.text(ERROR_USER_NOT_FOUND)
      throw new NotFoundError(msg)
    }
    const { file } = c.req.valid("form")

    const fileName = `profile_image/${user.id}.jpg`
    const presignedUrlResponse = await fetch(
      `${envVars.FILES_API_URL}/presigned-upload?fileName=${encodeURIComponent(
        fileName
      )}`,
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
    const { url: presignedUrl } =
      (await presignedUrlResponse.json()) as z.infer<typeof presignedUrlSchema>

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

    const updatedProfile = await db
      .updateTable("userProfiles")
      .set({ profileImage: fileName })
      .where("id", "=", profile.id)
      .returningAll()
      .executeTakeFirst()

    if (!updatedProfile) {
      const msg = await t.text(ERROR_UPLOAD_FAIL)
      throw new ServerError(msg)
    }
    return c.json({ ...updatedProfile, name: updatedProfile.fullName }, 200)
  } catch (error) {
    return await processError<typeof addProfilePicture>(c, error, [
      "{{ default }}",
      "add-profile-picture",
    ])
  }
})

userRoutes.openapi(deleteProfilePicture, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { id } = c.req.valid("param")
    if (user.id !== id && user.userType !== UserRoles.ROLE_SUPER_ADMIN) {
      const msg = await t.text(ERROR_FORBIDDEN)
      throw new ForbiddenError(msg)
    }

    const profile = await db
      .selectFrom("userProfiles")
      .selectAll()
      .where("id", "=", id)
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

    const { url: presignedUrl } =
      (await presignedUrlResponse.json()) as z.infer<typeof presignedUrlSchema>

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
    const updatedProfile = await db
      .updateTable("userProfiles")
      .set({ profileImage: null })
      .where("id", "=", profile.id)
      .returningAll()
      .executeTakeFirst()

    if (!updatedProfile) {
      const msg = await t.text(ERROR_PP_DELETE_FAIL)
      throw new ServerError(msg)
    }
    return c.json({ ...updatedProfile, name: updatedProfile.fullName }, 200)
  } catch (error) {
    return await processError<typeof deleteProfilePicture>(c, error, [
      "{{ default }}",
      "delete-profile-picture",
    ])
  }
})

userRoutes.openapi(getProfilePicture, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { id } = c.req.valid("param")

    const profile = await db
      .selectFrom("userProfiles")
      .selectAll()
      .where("id", "=", id)
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

    const { url } = (await presignedUrlResponse.json()) as z.infer<
      typeof presignedUrlSchema
    >

    return c.json({ url }, 200)
  } catch (error) {
    return await processError<typeof getProfilePicture>(c, error, [
      "{{ default }}",
      "get-profile-picture",
    ])
  }
})

export default userRoutes
