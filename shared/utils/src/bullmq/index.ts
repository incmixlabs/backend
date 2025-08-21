import { type Job, Queue, type QueueOptions, Worker } from "bullmq"

type EnvVars = {
  REDIS_URL: string
  REDIS_PASSWORD?: string
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

export type TaskJobData = {
  taskId: string
  title: string
  createdBy: string
}

const USER_STORY_QUEUE_NAME = "user-story"
const CODEGEN_QUEUE_NAME = "codegen"

export function setupUserStoryQueue(envVars: EnvVars): Queue<TaskJobData> {
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
  queue: Queue<TaskJobData>,
  data: TaskJobData
) {
  return queue.add(USER_STORY_QUEUE_NAME, data)
}

export function startUserStoryWorker<T>(
  envVars: EnvVars,
  callback: (job: Job<TaskJobData>) => Promise<T>
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

export function setupCodegenQueue(
  envVars: EnvVars
): Queue<TaskJobData & { figmaUrl: string }> {
  return createNewQueue(CODEGEN_QUEUE_NAME, {
    connection: {
      url: envVars.REDIS_URL,
      password: envVars.REDIS_PASSWORD,
    },
  })
}

export function addToCodegenQueue(
  queue: Queue<TaskJobData & { figmaUrl: string }>,
  data: TaskJobData & { figmaUrl: string }
) {
  return queue.add(CODEGEN_QUEUE_NAME, data)
}

export function startCodegenWorker<T>(
  envVars: EnvVars,
  callback: (job: Job<TaskJobData & { figmaUrl: string }>) => Promise<T>
) {
  const worker = new Worker(CODEGEN_QUEUE_NAME, callback, {
    connection: {
      url: envVars.REDIS_URL,
      password: envVars.REDIS_PASSWORD,
    },
    autorun: false,
    concurrency: 2,
  })

  return worker
}
