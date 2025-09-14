import type { FastifyInstance } from "fastify"

export const setupLocaleRoutes = (app: FastifyInstance) => {
  // Get all locales
  app.get(
    "/locales",
    {
      schema: {
        description: "Get all locales",
        tags: ["locales"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                code: { type: "string" },
                name: { type: "string" },
                isDefault: { type: "boolean" },
              },
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const db = request.context?.db
      if (!db) {
        throw new Error("Database not initialized")
      }

      const locales = await db.selectFrom("locales").selectAll().execute()

      return locales.map((l) => ({
        code: l.code,
        name: l.name,
        isDefault: Boolean(l.isDefault),
      }))
    }
  )

  // Get default locale
  app.get(
    "/locales/default",
    {
      schema: {
        description: "Get default locale",
        tags: ["locales"],
        response: {
          200: {
            type: "object",
            properties: {
              code: { type: "string" },
              name: { type: "string" },
              isDefault: { type: "boolean" },
            },
          },
          404: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const db = request.context?.db
      if (!db) {
        throw new Error("Database not initialized")
      }

      const defaultLocale = await db
        .selectFrom("locales")
        .selectAll()
        .where("isDefault", "=", true)
        .executeTakeFirst()

      if (!defaultLocale) {
        return reply.code(404).send({ message: "Default Locale not set" })
      }

      return {
        code: defaultLocale.code,
        name: defaultLocale.name,
        isDefault: Boolean(defaultLocale.isDefault),
      }
    }
  )

  // Get locale by code
  app.get(
    "/locales/:code",
    {
      schema: {
        description: "Get locale by code",
        tags: ["locales"],
        params: {
          type: "object",
          properties: {
            code: { type: "string" },
          },
          required: ["code"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              code: { type: "string" },
              name: { type: "string" },
              isDefault: { type: "boolean" },
            },
          },
          404: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { code } = request.params as { code: string }
      const db = request.context?.db
      if (!db) {
        throw new Error("Database not initialized")
      }

      const existingLocale = await db
        .selectFrom("locales")
        .selectAll()
        .where("code", "=", code)
        .executeTakeFirst()

      if (!existingLocale) {
        return reply
          .code(404)
          .send({ message: `Locale '${code}' doesn't exist` })
      }

      return {
        code: existingLocale.code,
        name: existingLocale.name,
        isDefault: Boolean(existingLocale.isDefault),
      }
    }
  )

  // Add new locale (requires authentication)
  app.post(
    "/locales",
    {
      schema: {
        description: "Add new locale",
        tags: ["locales"],
        body: {
          type: "object",
          properties: {
            code: { type: "string", minLength: 2 },
            name: { type: "string", minLength: 1 },
            isDefault: { type: "boolean", default: false },
          },
          required: ["code", "name"],
          additionalProperties: false,
        },
        response: {
          201: {
            type: "object",
            properties: {
              code: { type: "string" },
              name: { type: "string" },
              isDefault: { type: "boolean" },
            },
          },
          409: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const {
        code,
        name,
        isDefault = false,
      } = request.body as { code: string; name: string; isDefault?: boolean }
      const db = request.context?.db
      if (!db) {
        throw new Error("Database not initialized")
      }

      const existingLocale = await db
        .selectFrom("locales")
        .selectAll()
        .where("code", "=", code)
        .executeTakeFirst()

      if (existingLocale) {
        return reply.code(409).send({ message: "Locale already exists" })
      }

      const insertedLocale = await db
        .insertInto("locales")
        .values({
          code,
          name,
          isDefault,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      if (isDefault) {
        await db
          .updateTable("locales")
          .set({ isDefault: false })
          .where((eb) =>
            eb.and([
              eb("id", "!=", insertedLocale.id),
              eb("isDefault", "=", true),
            ])
          )
          .execute()
      }

      return reply.code(201).send({ code, name, isDefault })
    }
  )
}
