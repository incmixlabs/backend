# AJV Migration Guide

This guide explains how to use AJV instead of Zod for validation in the backend.

## Why AJV?

- **Performance**: AJV is significantly faster than Zod for validation
- **Bundle Size**: Smaller runtime footprint
- **Standards**: Based on JSON Schema standard
- **Maturity**: More established and stable
- **Features**: Better error messages and advanced validation features

## Current Implementation

AJV schemas and validation utilities have been added to the codebase:

### Available AJV Schemas

```typescript
// Import AJV schemas
import { 
  validateUser, 
  validateTask, 
  validateProject,
  type User,
  type Task,
  type Project
} from "@incmix-api/utils/ajv-schema"
```

### Available Validation Utilities

```typescript
// Import validation helpers
import { 
  ajvValidator, 
  getValidatedData,
  validateData 
} from "@incmix-api/utils/validation"
```

## Usage Examples

### 1. Using AJV Middleware in Hono Routes

```typescript
import { Hono } from "hono"
import { ajvValidator, getValidatedData } from "@incmix-api/utils/validation"
import { validateTask, type Task } from "@incmix-api/utils/ajv-schema"

const app = new Hono()

app.post(
  "/tasks",
  ajvValidator(validateTask, { target: 'json' }),
  async (c) => {
    const taskData = getValidatedData<Task>(c)
    
    // taskData is now typed and validated
    return c.json({ success: true, data: taskData })
  }
)
```

### 2. Manual Validation

```typescript
import { validateTask, type Task } from "@incmix-api/utils/ajv-schema"

app.post("/tasks", async (c) => {
  const body = await c.req.json()
  
  const isValid = validateTask(body)
  
  if (!isValid) {
    return c.json({
      success: false,
      errors: validateTask.errors
    }, 422)
  }
  
  const taskData = body as Task
  // Continue with valid data
})
```

### 3. Using Validation Utility

```typescript
import { validateData } from "@incmix-api/utils/validation"
import { validateUser } from "@incmix-api/utils/ajv-schema"

const result = validateData(validateUser, userData)

if (result.success) {
  // result.data is typed and valid
  console.log(result.data.name)
} else {
  // result.errors contains validation errors
  console.log(result.errors)
}
```

## Migration Strategy

Since the project heavily uses `@hono/zod-openapi`, complete replacement isn't practical. Instead, use this approach:

### Phase 1: Coexistence
- Keep existing Zod schemas for OpenAPI documentation
- Use AJV for performance-critical validation
- Gradually introduce AJV in new routes

### Phase 2: Selective Migration
- Replace Zod validation in high-traffic routes
- Use AJV for complex validation logic
- Keep Zod for OpenAPI schema generation

### Phase 3: Future Planning
- Monitor for `@hono/ajv-openapi` or similar packages
- Consider custom OpenAPI integration with AJV
- Full migration when OpenAPI integration is available

## Available Schemas

The following AJV schemas are available:

- `UserSchema` / `validateUser`
- `ChecklistItemSchema` / `validateChecklistItem`  
- `CommentSchema` / `validateComment`
- `ProjectSchema` / `validateProject`
- `TaskSchema` / `validateTask`
- `LabelSchema` / `validateLabel`
- `UploadFileSchema` / `validateUploadFile`

## Performance Benefits

AJV provides significant performance improvements:

- 5-10x faster validation than Zod
- Lower memory usage
- Better for high-throughput APIs
- Optimized compiled validators

## Error Handling

AJV validation errors are formatted to be similar to Zod errors:

```typescript
{
  path: string[],
  message: string,
  code: string,
  value: unknown
}
```

## Testing

AJV validation is tested in `shared/utils/src/__tests__/ajv-validation.test.ts`.

Run tests with:
```bash
pnpm test
```

## Next Steps

1. Try AJV validation in a non-critical route first
2. Compare performance with existing Zod validation
3. Gradually adopt AJV for new features
4. Monitor bundle size and runtime performance improvements

## Dependencies Added

- `ajv`: Core AJV library
- `ajv-formats`: Additional format validators (email, date, etc.)

These are added to the workspace and shared utils package.