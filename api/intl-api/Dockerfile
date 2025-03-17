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
COPY ./api/intl-api/package.json ./api/intl-api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy package files
COPY ./api/intl-api/ ./api/intl-api/

WORKDIR /app/shared/utils

RUN pnpm build

WORKDIR /app/api/intl-api

# Run the built app
RUN pnpm build

# Expose port 9090 (matches the port in src/index.ts)
EXPOSE 9090

CMD ["pnpm", "start"]
