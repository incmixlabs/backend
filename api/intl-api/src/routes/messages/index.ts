import type { FastifyInstance } from "fastify"

export const setupMessageRoutes = (app: FastifyInstance) => {
  // Get messages by locale
  app.get(
    "/messages/:locale",
    {
      schema: {
        description: "Get all messages by locale",
        tags: ["messages"],
        params: {
          type: "object",
          properties: {
            locale: { type: "string" },
          },
          required: ["locale"],
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                key: { type: "string" },
                value: { type: "string" },
                type: { type: "string" },
                namespace: { type: "string" },
                locale: { type: "string" },
              },
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
      const { locale } = request.params as { locale: string }
      const db = request.context?.db
      if (!db) {
        throw new Error("Database not initialized")
      }

      const dbLocale = await db
        .selectFrom("locales")
        .selectAll()
        .where("code", "=", locale)
        .executeTakeFirst()

      if (!dbLocale) {
        return reply.code(404).send({ message: "Locale not found" })
      }

      const messages = await db
        .selectFrom("translations")
        .selectAll()
        .where("localeId", "=", dbLocale.id)
        .execute()

      return messages.map((m) => ({
        ...m,
        locale,
      }))
    }
  )

  // Get default messages
  app.get(
    "/messages/default",
    {
      schema: {
        description: "Get default locale messages",
        tags: ["messages"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                key: { type: "string" },
                value: { type: "string" },
                type: { type: "string" },
                namespace: { type: "string" },
                locale: { type: "string" },
              },
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

      const dbLocale = await db
        .selectFrom("locales")
        .selectAll()
        .where("isDefault", "=", true)
        .executeTakeFirst()

      if (!dbLocale) {
        return reply.code(404).send({ message: "Default Locale not set" })
      }

      const messages = await db
        .selectFrom("translations")
        .selectAll()
        .where("localeId", "=", dbLocale.id)
        .execute()

      return messages.map((m) => ({
        ...m,
        locale: dbLocale.code,
      }))
    }
  )

  // Get specific message by key and locale
  app.get(
    "/messages/:locale/:key",
    {
      schema: {
        description: "Get message by key and locale",
        tags: ["messages"],
        params: {
          type: "object",
          properties: {
            locale: { type: "string" },
            key: { type: "string" },
          },
          required: ["locale", "key"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              key: { type: "string" },
              value: { type: "string" },
              type: { type: "string" },
              namespace: { type: "string" },
              locale: { type: "string" },
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
      const { locale, key } = request.params as { locale: string; key: string }
      const db = request.context?.db
      if (!db) {
        throw new Error("Database not initialized")
      }

      const dbLocale = await db
        .selectFrom("locales")
        .selectAll()
        .where("code", "=", locale)
        .executeTakeFirst()

      if (!dbLocale) {
        return reply.code(404).send({ message: "Locale not found" })
      }

      const message = await db
        .selectFrom("translations")
        .selectAll()
        .where("key", "=", key)
        .where("localeId", "=", dbLocale.id)
        .executeTakeFirst()

      if (!message) {
        return reply.code(404).send({
          message: `Translation not found for key: '${key}' and locale: '${locale}'`,
        })
      }

      return { locale, ...message }
    }
  )
}
