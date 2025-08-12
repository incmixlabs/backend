import { BASE_PATH } from "@/lib/constants"
import { OpenAPIHono } from "@hono/zod-openapi"

import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import type { HonoApp } from "@/types"
import { serve } from "@hono/node-server"
import { initDb } from "@incmix-api/utils/db-schema"
import { KVStore } from "@incmix-api/utils/kv-store"
import { setupKvStore } from "@incmix-api/utils/middleware"
import { startUserStoryWorker } from "@incmix-api/utils/queue"
import { nanoid } from "nanoid"
import { envVars } from "./env-vars"
import { generateUserStory } from "./lib/services"
const app = new OpenAPIHono<HonoApp>()

const globalStore = new KVStore({}, 900)

setupKvStore(app, BASE_PATH, globalStore)

middlewares(app)
routes(app)

serve(
  {
    fetch: app.fetch,
    port: envVars.PORT,
  },
  (info) => {
    console.log(`Server is running on port ${info.port}`)
  }
)

const worker = startUserStoryWorker(envVars, async (job) => {
  const db = initDb(envVars.DATABASE_URL)
  const task = await db
    .selectFrom("tasks")
    .selectAll()
    .where("id", "=", job.data.taskId)
    .executeTakeFirst()

  if (!task) {
    throw new Error("Task not found")
  }

  try {
    const userStoryResult = generateUserStory(task.name, undefined, "free")

    const result = await userStoryResult.object

    if (!result || !result.userStory) {
      console.error(
        `Invalid response from AI service for task ${job.data.taskId}:`,
        result
      )
      return Promise.resolve(
        `failed to generate user story for task ${job.data.taskId}: invalid response format`
      )
    }

    const { userStory } = result

    if (
      !userStory ||
      !userStory.description ||
      !userStory.acceptanceCriteria ||
      !userStory.checklist
    ) {
      console.error(
        `Incomplete user story data for task ${job.data.taskId}:`,
        userStory
      )
      return Promise.resolve(
        `failed to generate user story for task ${job.data.taskId}: incomplete data`
      )
    }

    await db.transaction().execute(async (tx) => {
      const updateResult = await tx
        .updateTable("tasks")
        .set({
          description: userStory.description,
          acceptanceCriteria: JSON.stringify(
            userStory.acceptanceCriteria.map((item, i) => ({
              id: nanoid(),
              title: item,
              checked: false,
              order: i,
            }))
          ),
          checklist: JSON.stringify(
            userStory.checklist.map((item, i) => ({
              id: nanoid(),
              title: item,
              checked: false,
              order: i,
            }))
          ),
        })
        .where("id", "=", job.data.taskId)
        .executeTakeFirst()

      return updateResult
    })

    return Promise.resolve(`updated task ${job.data.taskId}`)
  } catch (error) {
    console.error(
      `Error generating user story for task ${job.data.taskId}:`,
      error
    )
    return Promise.resolve(
      `failed to generate user story for task ${job.data.taskId}: ${(error as Error).message}`
    )
  }
})

worker.run()

export default app
