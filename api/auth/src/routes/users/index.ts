import type { FastifyInstance } from "fastify"

export const setupUsersRoutes = async (app: FastifyInstance) => {
  // Get all users (admin only)
  app.get(
    "/users",
    {
      schema: {
        description: "Get all users",
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
    },
    async (_request, _reply) => {
      // TODO: Implement user listing with proper auth and admin checks
      return { data: [] }
    }
  )

  // Update user profile
  app.put(
    "/users/profile",
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
    },
    async (_request, _reply) => {
      // TODO: Implement profile update
      return { message: "Profile updated successfully" }
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
    },
    async (_request, _reply) => {
      // TODO: Implement onboarding completion
      return { message: "Onboarding completed successfully" }
    }
  )
}
