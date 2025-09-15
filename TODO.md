# TODO
https://github.com/incmixlabs/backend/pull/96 pending issues
# circular deps in shared/src
https://github.com/incmixlabs/backend/pull/96
(nitpick, fix any and ts-ignore)

4. Update Your Route Handlers
Now update your route handlers in api/genai-api/src/routes/genai/index.ts. Replace all instances of:

// Remove this import at the top
import { useTranslation } from "@incmix-api/utils/middleware"

// Replace this pattern:
const t = await useTranslation(request as any)
if (!user) {
  const msg = await t.text(ERROR_UNAUTHORIZED)
  throw new UnauthorizedError(msg)
}

// With this:
import { useFastifyTranslation } from "@incmix-api/utils/fastify-bootstrap/translation-plugin"

// And in each route handler:
if (!user) {
  const t = await useFastifyTranslation(request)
  const msg = await t.text(ERROR_UNAUTHORIZED)
  throw new UnauthorizedError(msg)
}
Here's the complete updated route handler pattern:

import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import { processError, UnauthorizedError } from "@incmix-api/utils/errors"
import { getDb, streamSSE } from "@incmix-api/utils/fastify-bootstrap"
import { useFastifyTranslation } from "@incmix-api/utils/fastify-bootstrap/translation-plugin"
import type { FastifyInstance, FastifyRequest } from "fastify"

export const setupGenaiRoutes = (app: FastifyInstance) => {
  app.post("/generate-project", {
    // ... schema definition
  }, async (request: FastifyRequest, reply) => {
    try {
      const user = request.user
      
      if (!user) {
        const t = await useFastifyTranslation(request)
        const msg = await t.text(ERROR_UNAUTHORIZED)
        throw new UnauthorizedError(msg)
      }

      // ... rest of your route logic
    } catch (error) {
      return await processError(request as any, error, [
        "{{ default }}",
        "generate-user-story",
      ])
    }
  })
  
  // Apply the same pattern to all other route handlers...
}
5. Update All Route Files
Apply the same pattern to:

api/genai-api/src/routes/templates/index.ts
Any other files using useTranslation

