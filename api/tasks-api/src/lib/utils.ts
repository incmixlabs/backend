import type { Job } from "bullmq"

export async function getJobState(
  job: Job
): Promise<"pending" | "in_progress" | "completed" | "failed" | "unknown"> {
  const state = await job.getState()
  switch (state) {
    case "waiting":
    case "delayed":
      return "pending"
    case "active":
    case "waiting-children":
      return "in_progress"
    case "completed":
      return "completed"
    case "failed":
      return "failed"
    default:
      return "unknown"
  }
}
