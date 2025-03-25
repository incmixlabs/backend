FROM node:22-alpine AS builder

WORKDIR /app

# Install only necessary build dependencies
RUN apk add --no-cache git && \
  npm install -g pnpm turbo kysely-ctl@0.11.0

# Copy only files needed for dependency installation
COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./turbo.json ./
COPY ./shared/utils/package.json ./shared/utils/
COPY ./api/org-api/package.json ./api/org-api/

# Install dependencies with production flag
RUN pnpm install --frozen-lockfile --prod=false

# Copy only necessary source files
COPY ./shared/ ./shared/
COPY ./api/org-api/ ./api/org-api/

# Build the shared utils
WORKDIR /app/shared/utils
RUN pnpm build

# Build the org service
WORKDIR /app/api/org-api
RUN pnpm build

# Create a smaller production image
FROM node:22-alpine AS runner

WORKDIR /app

# Install only runtime dependencies
RUN npm install -g pnpm kysely-ctl@0.11.0

# Copy package files for production dependencies
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/shared/utils/package.json ./shared/utils/
COPY --from=builder /app/api/org-api/package.json ./api/org-api/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder stage
COPY --from=builder /app/shared/utils/dist ./shared/utils/dist
COPY --from=builder /app/api/org-api/dist ./api/org-api/dist
COPY --from=builder /app/api/org-api/.config ./api/org-api/.config
COPY --from=builder /app/api/org-api/migrations ./api/org-api/migrations

WORKDIR /app/api/org-api

# Expose port 9292 (matches the port in src/index.ts)
EXPOSE 9292

CMD ["pnpm", "start"]
