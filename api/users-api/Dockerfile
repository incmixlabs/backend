FROM node:22-alpine

WORKDIR /app

# Install git, pnpm and turbo
RUN apk add --no-cache git && \
  npm install -g pnpm turbo kysely-ctl@0.11.0

# Copy root workspace files
COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./turbo.json ./

# Copy shared packages
COPY ./shared/ ./shared/


# Copy intl package.json
COPY ./api/users-api/package.json ./api/users-api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy package files
COPY ./api/users-api/ ./api/users-api/

WORKDIR /app/shared/utils

RUN pnpm build

WORKDIR /app/api/users-api

# Run the built app
RUN pnpm build

# Expose port 9191 (matches the port in src/index.ts)
EXPOSE 9191

CMD ["pnpm", "start"]
