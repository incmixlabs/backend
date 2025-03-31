import { envVars } from "@/env-vars"
import type { Context } from "@/types"
import type { Organization } from "@incmix/utils/types"

export async function getOrganizationById(c: Context, id: string) {
  const url = `${envVars.ORG_URL}/id/${id}`

  const res = await fetch(url, {
    method: "get",
    headers: c.req.header(),
  })

  if (res.status !== 200 && res.status !== 404) {
    const data = (await res.json()) as { message: string }
    throw new Error(data.message)
  }

  if (res.status === 404) {
    return
  }

  return res.json()
}

export type AIModel = "claude-3-sonnet-20240229" | "gemini-1.5-flash-latest"

export async function generateUserStory(
  c: Context,
  prompt: string,
  userTier: "free" | "paid" = "free"
): Promise<string> {
  // Use Claude for paid users, Gemini for free users
  const model = userTier === "paid" ? "claude-3-sonnet-20240229" : "gemini-1.5-flash-latest"
  
  try {
    // Example implementation - In a real setup, you would:
    // 1. Call the appropriate AI API based on the model
    // 2. Handle authentication, rate limiting, etc.
    // 3. Process the response
    
    // Mock the AI service for now
    // In a real implementation, this would call the appropriate AI API
    const userStory = await mockAICompletion(prompt, model)
    return userStory
  } catch (error) {
    console.error(`Error generating user story with ${model}:`, error)
    throw new Error(`Failed to generate user story: ${(error as Error).message}`)
  }
}

// Mock function - replace with actual API calls in production
async function mockAICompletion(prompt: string, model: AIModel): Promise<string> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Format the prompt for user story generation
  const enhancedPrompt = `
    Create a user story based on the following prompt: "${prompt}"
    
    Format as:
    As a [type of user], I want [goal] so that [benefit/value].
    
    Acceptance Criteria:
    - [criterion 1]
    - [criterion 2]
    - [criterion 3]
  `
  
  // Return a simulated response
  // In a real implementation, this would be the response from the AI API
  return `As a project manager, I want to ${prompt} so that I can efficiently track project progress.
  
Acceptance Criteria:
- The feature should be accessible from the main dashboard
- It should save all entries automatically
- Users should receive confirmation when the action is complete
- The interface should be responsive on both desktop and mobile devices`
}
