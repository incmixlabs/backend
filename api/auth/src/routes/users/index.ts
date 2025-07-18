import { findUserById } from "@/lib/db"

import { invalidateAllSessions } from "@/auth/session"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import {
  ERROR_CASL_FORBIDDEN,
  ERROR_UNAUTHORIZED,
  createKyselyFilter,
  parseQueryParams,
} from "@incmix-api/utils"
import {
  type Database,
  type UserColumns,
  userColumns,
} from "@incmix-api/utils/db-schema"
import {
  ForbiddenError,
  ServerError,
  UnauthorizedError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { UserRoles } from "@incmix/utils/types"
import type { ExpressionWrapper, OrderByExpression, SqlBool } from "kysely"

import { hashPassword } from "@/auth/utils"
import { getAllUsers, setEnabled, setPassword, setVerified } from "./openapi"
const userRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
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
    const { filters, sort, joinOperator, pagination } =
      parseQueryParams<UserColumns>(queryParams, userColumns)

    let query = c
      .get("db")
      .selectFrom("users")
      .leftJoin("accounts", "userId", "id")
      .select([
        "id",
        "emailVerifiedAt as verified",
        "isActive as enabled",
        "accounts.provider as oauth",
      ])

    if (filters.length)
      query = query.where(({ eb, and, or }) => {
        const expressions: ExpressionWrapper<
          Database,
          "users",
          string | SqlBool | null | number
        >[] = []

        for (const filter of filters) {
          const kf = createKyselyFilter<UserColumns, Database, "users">(
            filter,
            eb
          )
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
          const field = s.id as UserColumns
          const order = s.desc ? "desc" : "asc"
          const expression: OrderByExpression<Database, "users", typeof order> =
            `${field} ${order}`

          return expression
        })
      )
    }

    const total = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .groupBy(["users.id", "accounts.provider"])
      .executeTakeFirst()

    if (pagination) {
      query = query.limit(pagination.pageSize)
      if (pagination.page && pagination.page > 1) {
        query = query.offset((pagination.page - 1) * pagination.pageSize)
      }
    }

    const users = await query.execute()

    const totalPages = Math.ceil(
      (total?.count ?? 1) / (pagination?.pageSize ?? 10)
    )

    const hasNextPage = totalPages > (pagination?.page ?? 1)
    const hasPrevPage = (pagination?.page ?? 1) > 1

    return c.json(
      {
        results: users.map((u) => ({
          ...u,
          verified: Boolean(u.verified),
          enabled: Boolean(u.enabled),
        })),
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
      "getAllUsers",
    ])
  }
})

userRoutes.openapi(setVerified, async (c) => {
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

userRoutes.openapi(setEnabled, async (c) => {
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
userRoutes.openapi(setPassword, async (c) => {
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

export default userRoutes
