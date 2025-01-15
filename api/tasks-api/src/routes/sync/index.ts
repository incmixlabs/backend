import { tables } from "@/dbSchema"
import { ERROR_ORG_NOT_FOUND, ERROR_PROJECT_NOT_FOUND } from "@/lib/constants"
import { getDatabase, getProjectById } from "@/lib/db"
import { getOrganizationById } from "@/lib/services"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { ERROR_FORBIDDEN, ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import type { DdlSchema, DdlVersion } from "@incmix/shared/types"
import { DateTime } from "luxon"
import { getSchema, pullChanges, pushChanges } from "./openapi"
const syncRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

syncRoutes.openapi(getSchema, async (c) => {
  try {
    const schemaVersion = await c.env.DB.prepare(
      "SELECT version FROM schema_meta ORDER BY updated_at DESC LIMIT 1"
    ).first<DdlVersion>()

    const { results: schemaDDL } = await c.env.DB.prepare(
      `SELECT sql,name FROM sqlite_master WHERE type='table'`
    ).all<DdlSchema>()

    return c.json(
      {
        version: schemaVersion?.version ?? 1,
        schema: schemaDDL.filter((s) => tables.includes(s.name)),
      },
      200
    )
  } catch (error) {
    return await processError<typeof getSchema>(c, error, [
      "{{ default }}",
      "get-schema",
    ])
  }
})

syncRoutes.openapi(pushChanges, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { columns, tasks } = c.req.valid("json")

    const db = getDatabase(c)

    const deletedColumns = columns.deletes

    if (deletedColumns.length) {
      await db.deleteFrom("columns").where("id", "in", deletedColumns).execute()
    }
    const deletedTasks = tasks.deletes

    if (deletedTasks.length) {
      await db.deleteFrom("tasks").where("id", "in", deletedTasks).execute()
    }

    const updatedColumns = columns.updates.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }))

    if (updatedColumns.length) {
      await Promise.all(
        updatedColumns.map(async (c) => {
          const existing = await db
            .selectFrom("columns")
            .select(["id", "updatedAt"])
            .where("id", "=", c.id)
            .executeTakeFirst()
          if (existing) {
            const existingModifiedAt = DateTime.fromJSDate(existing.updatedAt)
            const newModifiedAt = DateTime.fromISO(c.updatedAt)
            if (existingModifiedAt < newModifiedAt)
              await db
                .updateTable("columns")
                .set(c)
                .where("id", "=", c.id)
                .execute()
          } else await db.insertInto("columns").values(c).execute()
        })
      )
    }

    const updatedTasks = tasks.updates.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }))

    if (updatedTasks.length) {
      await Promise.all(
        updatedTasks.map(async (c) => {
          const existing = await db
            .selectFrom("tasks")
            .select("id")
            .where("id", "=", c.id)
            .executeTakeFirst()
          if (existing)
            await db
              .updateTable("tasks")
              .set(c)
              .where("id", "=", c.id)
              .execute()
          else await db.insertInto("tasks").values(c).execute()
        })
      )
    }

    return c.json({ message: "Changes pushed successfully" }, 200)
  } catch (error) {
    return await processError<typeof pushChanges>(c, error, [
      "{{ default }}",
      "push-changes",
    ])
  }
})

syncRoutes.openapi(pullChanges, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { projectId } = c.req.valid("query")

    const data = await getProjectById(c, projectId)
    if (!data) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new NotFoundError(msg)
    }
    const org = await getOrganizationById(c, data.orgId)
    if (!org) {
      const msg = await t.text(ERROR_ORG_NOT_FOUND)
      throw new NotFoundError(msg)
    }
    const isMember = org.members.find((m) => m.userId === user.id)
    if (!isMember) {
      const msg = await t.text(ERROR_FORBIDDEN)
      throw new ForbiddenError(msg)
    }

    return c.json(
      {
        columns: data.columns,
        tasks: data.tasks,
      },
      200
    )
  } catch (error) {
    return await processError<typeof pullChanges>(c, error, [
      "{{ default }}",
      "pull-changes",
    ])
  }
})

export default syncRoutes
