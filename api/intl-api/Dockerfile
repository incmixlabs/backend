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
COPY ./api/intl-api/package.json ./api/intl-api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy package files
COPY ./api/intl-api/ ./api/intl-api/

WORKDIR /app/api/intl-api

# Expose port 8787 (matches the port in src/index.ts)
EXPOSE 9090

# Run the built app
CMD ["pnpm", "dev"]
