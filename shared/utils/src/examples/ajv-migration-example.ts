// Example showing how to migrate from Zod to AJV validation
// This can be used as a reference for gradual migration

import { Hono } from "hono"
import { ajvValidator, getValidatedData } from "@incmix-api/utils/validation"
import { validateTask, type Task } from "@incmix-api/utils/ajv-schema"

const app = new Hono()

// Example: Using AJV validation in a Hono route
app.post(
  "/tasks-ajv",
  ajvValidator(validateTask, { target: 'json' }), // AJV validation middleware
  async (c) => {
    // Get validated data (typed as Task)
    const taskData = getValidatedData<Task>(c)
    
    // Use the validated data
    console.log("Valid task data:", taskData)
    
    return c.json({
      success: true,
      data: taskData
    })
  }
)

// Example: Manual validation without middleware
app.post("/tasks-manual-ajv", async (c) => {
  const body = await c.req.json()
  
  // Manual validation
  const valid = validateTask(body)
  
  if (!valid) {
    const errors = validateTask.errors || []
    return c.json({
      success: false,
      errors: errors.map(error => ({
        path: error.instancePath,
        message: error.message,
        value: error.data
      }))
    }, 422)
  }
  
  // Body is now validated as Task type
  const taskData = body as Task
  
  return c.json({
    success: true,
    data: taskData
  })
})

export { app }

/*
Migration Strategy:

1. Keep existing Zod schemas for OpenAPI documentation
2. Create equivalent AJV schemas for validation
3. Gradually replace Zod validation with AJV validation in routes
4. Use AJV for performance-critical validation endpoints
5. Eventually phase out Zod when OpenAPI can be replaced or when @hono/ajv-openapi becomes available

Benefits of AJV:
- Faster validation performance
- Smaller bundle size
- Industry standard JSON Schema
- More mature and stable
- Better error messages
- Supports more advanced validation features

Migration process:
1. Create AJV schema equivalent to Zod schema
2. Replace validation middleware
3. Update type annotations
4. Test thoroughly
5. Remove old Zod schema when no longer needed
*/