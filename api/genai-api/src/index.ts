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
import type { DeepPartial } from "ai"
import { nanoid } from "nanoid"
import { envVars } from "./env-vars"
import { generateUserStory } from "./lib/services"
const app = new OpenAPIHono<HonoApp>()

const globalStore = new KVStore({}, 900)

setupKvStore(app, BASE_PATH, globalStore)

middlewares(app)
routes(app)

const globalDb = initDb(envVars.DATABASE_URL)
const worker = startUserStoryWorker(envVars, async (job) => {
  console.log(`Processing job ${job.id} for task ${job.data.taskId}`)
  const db = globalDb ? globalDb : initDb(envVars.DATABASE_URL)
  const task = await db
    .selectFrom("tasks")
    .selectAll()
    .where("id", "=", job.data.taskId)
    .executeTakeFirst()
  if (!task) {
    throw new Error("Task not found")
  }
  console.log(`Task found: ${task?.name}`)

  try {
    console.log(`Generating user story for task ${task.name}`)
    const userStoryResult = generateUserStory(task.name, undefined, "free")

    const stream = await userStoryResult.partialObjectStream
    const result: DeepPartial<{
      userStory: {
        description: string
        acceptanceCriteria: string[]
        checklist: string[]
      }
    }> = {}
    for await (const chunk of stream) {
      console.log(`User story result: ${JSON.stringify(chunk)}`)
      result.userStory = {
        ...result.userStory,
        ...chunk.userStory,
      }
    }
    console.log(`User story result: ${JSON.stringify(result)}`)
    if (!result || !result.userStory) {
      console.error(
        `Invalid response from AI service for task ${job.data.taskId}:`,
        result
      )
      return Promise.resolve(
        `failed to generate user story for task ${job.data.taskId}: invalid response format`
      )
    }

    const { description, acceptanceCriteria, checklist } = result.userStory

    if (
      description !== undefined &&
      acceptanceCriteria !== undefined &&
      checklist !== undefined
    ) {
      console.log(`Updating task ${job.data.taskId} with user story`)
      await db.transaction().execute(async (tx) => {
        const updateResult = await tx
          .updateTable("tasks")
          .set({
            description,
            acceptanceCriteria: JSON.stringify(
              acceptanceCriteria.map((item, i) => ({
                id: nanoid(),
                title: item,
                checked: false,
                order: i,
              }))
            ),
            checklist: JSON.stringify(
              checklist.map((item, i) => ({
                id: nanoid(),
                title: item,
                checked: false,
                order: i,
              }))
            ),
            updatedBy: job.data.createdBy,
            updatedAt: new Date().toISOString(),
          })
          .where("id", "=", job.data.taskId)
          .returningAll()
          .executeTakeFirst()
        console.log(`Update result: ${JSON.stringify(updateResult)}`)
        return updateResult
      })

      console.log(`Task ${job.data.taskId} updated`)
      return Promise.resolve(`updated task ${job.data.taskId}`)
    }
    console.error(
      `Incomplete user story data for task ${job.data.taskId}:`,
      result.userStory
    )
    return Promise.resolve(
      `failed to generate user story for task ${job.data.taskId}: incomplete data`
    )
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

serve(
  {
    fetch: app.fetch,
    port: envVars.PORT,
  },
  (info) => {
    console.log(`Server is running on port ${info.port}`)
  }
)

process.on("SIGINT", async () => {
  await worker.close()
  process.exit(0)
})

export default app
