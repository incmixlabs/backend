import { type Job, Queue, type QueueOptions, Worker } from "bullmq"

/**
 * DragonflyDB BullMQ Optimization Utilities
 *
 * For optimal performance with DragonflyDB, use hashtags in queue names.
 * This ensures each queue is assigned to a specific DragonflyDB thread.
 *
 * @see https://www.dragonflydb.io/docs/integrations/bullmq#using-hashtags--optimized-configurations
 */

/**
 * Creates a DragonflyDB-optimized queue name with hashtags
 * This ensures the queue is assigned to a specific DragonflyDB thread
 * for optimal performance and thread balancing
 */
function createOptimizedQueueName(name: string): string {
  return `{${name}}`
}

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

// Using hashtags for optimal DragonflyDB performance
// Each queue gets assigned to a specific DragonflyDB thread for better performance
const USER_STORY_QUEUE_NAME = createOptimizedQueueName("user-story")
const CODEGEN_QUEUE_NAME = createOptimizedQueueName("codegen")

/**
 * Sets up the user story queue with DragonflyDB optimizations
 * Uses hashtag-based queue naming for optimal thread assignment
 */
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

/**
 * Sets up the codegen queue with DragonflyDB optimizations
 * Uses hashtag-based queue naming for optimal thread assignment
 */
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
