FROM node:22-alpine

WORKDIR /app

# Install git, pnpm and turbo
RUN apk add --no-cache git && \
  npm install -g pnpm turbo kysely-ctl@0.11.0

# Copy root workspace files
COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./turbo.json ./

# Copy shared packages
COPY ./shared/ ./shared/


# Copy auth package.json
COPY ./api/files-api/package.json ./api/files-api/

# Install dependencies
RUN pnpm install

# Copy package files
COPY ./api/files-api/ ./api/files-api/

WORKDIR /app/shared/utils

RUN pnpm build

WORKDIR /app/api/files-api

# Run the built app
RUN pnpm build

# Expose port 8787 (matches the port in src/index.ts)
EXPOSE 8282


CMD ["pnpm", "start"]
