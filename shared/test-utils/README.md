# Shared Utilities

This package contains shared utilities used across the Incmix API microservices.

## Available Utilities

- **Health Check**: A standard implementation for health check endpoints ([documentation](./docs/health-check.md))
- **Error Handling**: Common error handling utilities
- **Middleware**: Shared middleware for request handling
- **KV Store**: Utilities for working with key-value stores
- **Internationalization**: Utilities for i18n support

## Usage

Import the utilities in your service:

```typescript
// Import utility functions
import { createHealthCheckRoute, ... } from "@incmix-api/utils"

// Import middleware
import { corsMiddleware, ... } from "@incmix-api/utils/middleware"

// Import error handling
import { processErrors, ... } from "@incmix-api/utils/errors"

// Import KV store utilities
import { createKVStore, ... } from "@incmix-api/utils/kv-store"

// Import types
import type { ... } from "@incmix-api/utils/types"
```

## Documentation

See the documentation for specific utilities:

- [Health Check](./docs/health-check.md)