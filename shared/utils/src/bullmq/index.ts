import { type Job, Queue, type QueueOptions, Worker } from "bullmq"

type EnvVars = {
  REDIS_URL: string
  REDIS_PASSWORD: string
}

function createNewQueue(
  name: string,
  { connection, ...options }: QueueOptions
) {
  return new Queue(name, {
    ...options,
    connection,
  })
}

export type UserStoryJobData = {
  taskId: string
  title: string
  createdBy: string
}

const USER_STORY_QUEUE_NAME = "user-story"

export function setupUserStoryQueue(envVars: EnvVars): Queue<UserStoryJobData> {
  return createNewQueue(USER_STORY_QUEUE_NAME, {
    connection: {
      url: envVars.REDIS_URL,
      password: envVars.REDIS_PASSWORD,
    },
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
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
      url: envVars.REDIS_URL,
      password: envVars.REDIS_PASSWORD,
    },
    autorun: false,
    concurrency: 2,
  })

  return worker
}
