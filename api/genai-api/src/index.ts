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

startUserStoryWorker(envVars, async (job) => {
  const db = initDb(envVars.DATABASE_URL)
  const task = await db
    .selectFrom("tasks")
    .selectAll()
    .where("statusId", "=", job.data.taskId)
    .executeTakeFirst()

  if (!task) {
    throw new Error("Task not found")
  }

  const userStoryResult = generateUserStory(task.name)

  const { userStory } = await userStoryResult.object

  if (
    !userStory ||
    !userStory.description ||
    !userStory.acceptanceCriteria ||
    !userStory.checklist
  ) {
    return Promise.resolve(
      `failed to generate user story for task ${job.data.taskId}`
    )
  }

  const updateResult = await db
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

  if (updateResult) {
    return Promise.resolve(`updated task ${job.data.taskId}`)
  }
  return Promise.resolve(`failed to update task ${job.data.taskId}`)
})
export default app
