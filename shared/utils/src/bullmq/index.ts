import { type ConnectionOptions, type Job, Queue, Worker } from "bullmq"

type EnvVars = {
  REDIS_HOST: string
  REDIS_PORT: number
  REDIS_PASSWORD: string
}

function createNewQueue(name: string, connection: ConnectionOptions) {
  return new Queue(name, {
    connection,
  })
}

export type UserStoryJobData = {
  taskId: string
  title: string
}

const USER_STORY_QUEUE_NAME = "user-story"

export function setupUserStoryQueue(envVars: EnvVars): Queue<UserStoryJobData> {
  return createNewQueue(USER_STORY_QUEUE_NAME, {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
  })
}

export function addUserStoryToQueue(
  queue: Queue<UserStoryJobData>,
  data: UserStoryJobData
) {
  return queue.add(USER_STORY_QUEUE_NAME, data)
}

export function startUserStoryWorker<T>(
  envVars: EnvVars,
  callback: (job: Job<UserStoryJobData>) => Promise<T>
) {
  const worker = new Worker(USER_STORY_QUEUE_NAME, callback, {
    connection: {
      host: envVars.REDIS_HOST,
      port: envVars.REDIS_PORT,
      password: envVars.REDIS_PASSWORD,
    },
    autorun: false,
  })

  return worker
}
