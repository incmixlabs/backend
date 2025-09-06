# Zod to AJV Migration

This document outlines the migration from Zod to AJV for schema validation across the backend services.

## What Changed

### 1. Dependencies
- **Added**: `ajv`, `ajv-formats`, `ajv-errors`, `@types/json-schema`
- **Kept (temporarily)**: `zod`, `@hono/zod-openapi` - marked for removal after full migration

### 2. New AJV Infrastructure

#### Schema Utilities (`shared/utils/src/ajv-schema/`)
- `index.ts` - Core AJV validation utilities
- `projects.ts` - Project-related schemas migrated from Zod
- `files.ts` - File upload schemas migrated from Zod

#### Hono Integration (`shared/utils/src/ajv-hono/`)
- Custom middleware for Hono framework to replace `@hono/zod-openapi`
- Provides `jsonValidator`, `queryValidator`, and OpenAPI documentation generation

### 3. Environment Configuration
- Updated `env-config/index.ts` to use AJV instead of Zod
- Maintained all existing functionality while switching validation backend

## Migration Strategy

### Phase 1: Infrastructure ✅
1. Set up AJV dependencies and core utilities
2. Create AJV schema definitions for existing Zod schemas  
3. Build Hono middleware to replace `@hono/zod-openapi`
4. Update environment configuration

### Phase 2: Route-by-Route Migration (TODO)
Each API route needs to be updated to use AJV:

```typescript
// Before (Zod)
import { OpenAPIHono } from "@hono/zod-openapi"
import { SignupSchema } from "./types"

// After (AJV)
import { createAjvApp, jsonValidator } from "@incmix-api/utils/ajv-hono"
import { SignupSchema, SignupValidator } from "./types-ajv"

const app = createAjvApp()
app.post("/signup", jsonValidator(SignupSchema), async (c) => {
  const data = c.get("validatedData")
  // ... rest of handler
})
```

### Phase 3: Cleanup (TODO)
1. Remove `zod` and `@hono/zod-openapi` dependencies
2. Delete old Zod schema files
3. Update imports across the codebase

## Benefits of AJV

1. **Performance**: AJV is significantly faster than Zod for validation
2. **Standards Compliance**: Uses JSON Schema standard
3. **Smaller Bundle Size**: Less overhead than Zod
4. **Better Error Handling**: More detailed validation error messages
5. **OpenAPI Integration**: Native JSON Schema works better with OpenAPI specs

## Key Differences

### Schema Definition
```typescript
// Zod
const UserSchema = z.object({
  id: z.string().max(100),
  name: z.string(),
  email: z.string().email().optional()
}).openapi("User")

// AJV
const UserSchema = {
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    name: { type: "string" },
    email: { type: "string", format: "email" }
  },
  required: ["id", "name"],
  additionalProperties: false
}
```

### Validation
```typescript
// Zod
const result = UserSchema.safeParse(data)
if (!result.success) {
  // handle error
}

// AJV
const validator = createValidator(UserSchema)
const result = validator.safeParse(data)
if (!result.success) {
  // handle error
}
```

## Rollback Plan

If issues arise, the migration can be rolled back by:
1. Reverting to old Zod imports
2. Switching routes back to use `OpenAPIHono` 
3. The Zod dependencies remain available during the transition

## Next Steps

1. **Test the new infrastructure** with existing functionality
2. **Migrate individual API routes** starting with simple ones
3. **Update tests** to use new validation patterns
4. **Remove Zod dependencies** once migration is complete

## Files Changed

- `shared/utils/src/ajv-schema/index.ts` (new)
- `shared/utils/src/ajv-schema/projects.ts` (new)  
- `shared/utils/src/ajv-schema/files.ts` (new)
- `shared/utils/src/ajv-hono/index.ts` (new)
- `shared/utils/src/env-config/index.ts` (modified)
- `shared/utils/package.json` (modified)
- `pnpm-workspace.yaml` (modified)
- `package.json` (modified - added AJV deps)

The migration foundation is now complete and ready for route-by-route updates.