import type { ChecklistItem } from "@incmix/utils/types"
import { createService } from "@incmix-api/utils"
import { initDb } from "@incmix-api/utils/db-schema"
import { startUserStoryWorker } from "@incmix-api/utils/queue"
import type { DeepPartial } from "ai"
import { nanoid } from "nanoid"
import { BASE_PATH } from "@/lib/constants"
import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import type { HonoApp } from "@/types"
import { envVars } from "./env-vars"
import { generateUserStory } from "./lib/services"

const mapToChecklistItems = (items: (string | undefined)[]): ChecklistItem[] =>
  items
    .filter(
      (item): item is string => item !== undefined && item.trim().length > 0
    )
    .map((item, i) => ({
      id: nanoid(),
      text: item,
      checked: false,
      order: i,
    }))

const globalDb = initDb(envVars.DATABASE_URL)
const worker = startUserStoryWorker(envVars, async (job) => {
  console.log(`Processing job ${job.id} for task ${job.data.taskId}`)
  const db = globalDb
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

    const stream = userStoryResult.partialObjectStream
    const result: DeepPartial<{
      userStory: {
        description: string
        acceptanceCriteria: string[]
        checklist: string[]
      }
    }> = {}
    for await (const chunk of stream) {
      console.log(`User story result: ${JSON.stringify(chunk)}`)
      const typedChunk = chunk as DeepPartial<{
        userStory: {
          description: string
          acceptanceCriteria: string[]
          checklist: string[]
        }
      }>
      if (typedChunk.userStory) {
        result.userStory = {
          ...result.userStory,
          ...typedChunk.userStory,
        }
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
      description?.trim()?.length &&
      acceptanceCriteria?.length &&
      checklist?.length
    ) {
      console.log(`Updating task ${job.data.taskId} with user story`)

      await db.transaction().execute(async (tx) => {
        const updateResult = await tx
          .updateTable("tasks")
          .set({
            description,
            acceptanceCriteria: JSON.stringify(
              mapToChecklistItems(acceptanceCriteria)
            ),
            checklist: JSON.stringify(mapToChecklistItems(checklist)),
            updatedBy: job.data.createdBy,
            updatedAt: new Date().toISOString(),
          })
          .where("id", "=", job.data.taskId)
          .returningAll()
          .executeTakeFirst()

        if (!updateResult) {
          throw new Error(
            `Task update failed: not found for task ${job.data.taskId}`
          )
        }

        console.log(`Update result: ${JSON.stringify(updateResult)}`)
        return updateResult
      })

      console.log(`Task ${job.data.taskId} updated`)
      return `updated task ${job.data.taskId}`
    }
    console.error(
      `Incomplete user story data for task ${job.data.taskId}:`,
      result.userStory
    )
    return `failed to generate user story for task ${job.data.taskId}: incomplete data`
  } catch (error) {
    console.error(
      `Error generating user story for task ${job.data.taskId}:`,
      error
    )
    return `failed to generate user story for task ${job.data.taskId}: ${(error as Error).message}`
  }
})

worker.run()

const service = createService<HonoApp["Bindings"], HonoApp["Variables"]>({
  name: "genai-api",
  port: envVars.PORT,
  basePath: BASE_PATH,
  setupMiddleware: (app) => {
    middlewares(app)
  },
  needDB: true,
  databaseUrl: envVars.DATABASE_URL,
  setupRoutes: (app) => routes(app),
})

const { app, startServer } = service

startServer()

const shutdown = async (signal: NodeJS.Signals) => {
  console.log(`Received ${signal}. Shutting down gracefully...`)
  try {
    await worker.close()
  } catch (e) {
    console.error("Error closing worker:", e)
  }
  try {
    await globalDb.destroy()
  } catch (e) {
    console.error("Error closing DB:", e)
  }
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

export default app
