FROM node:22-alpine AS builder

WORKDIR /app

# Install only necessary build dependencies
RUN apk add --no-cache git && \
  npm install -g pnpm turbo

# Copy only files needed for dependency installation
COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./turbo.json ./
COPY ./shared/utils/package.json ./shared/utils/
COPY ./api/projects-api/package.json ./api/projects-api/

# Install dependencies with production flag
RUN pnpm install --frozen-lockfile --prod=false

# Copy only necessary source files
COPY ./shared/ ./shared/
COPY ./api/projects-api/ ./api/projects-api/

ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN

RUN pnpm build

# Create a smaller production image
FROM node:22-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

# Copy package files for production dependencies
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/shared/utils/package.json ./shared/utils/
COPY --from=builder /app/api/projects-api/package.json ./api/projects-api/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder stage
COPY --from=builder /app/shared/utils/dist ./shared/utils/dist
COPY --from=builder /app/api/projects-api/dist ./api/projects-api/dist
WORKDIR /app/api/projects-api

# Expose port 8888 (matches the port in src/index.ts)
EXPOSE 8888

CMD ["pnpm", "start"]
