# Use official PostgreSQL 17 Alpine base image
FROM postgres:17-alpine

# Install plpython3u extension and Node.js as root
USER root
RUN apk add --no-cache \
    postgresql-plpython3 \
    git \
    nodejs \
    npm

# Create initialization script to enable extension
RUN mkdir -p /docker-entrypoint-initdb.d
COPY <<EOF /docker-entrypoint-initdb.d/init-plpython.sql
-- Enable plpython3u extension
CREATE EXTENSION IF NOT EXISTS plpython3u;

-- Create a simple test function for plpython3u
CREATE OR REPLACE FUNCTION test_python()
RETURNS text AS \$\$
    return "Hello from Python!"
\$\$ LANGUAGE plpython3u;
EOF
# Set up Node.js application
WORKDIR /app

# Install pnpm and turbo globally
RUN npm install -g pnpm turbo

# COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./turbo.json ./

COPY ./db/package.json ./

# Install dependencies
RUN pnpm install --prod

COPY ./db/api-migrations ./api-migrations

COPY ./db/migrations ./migrations
COPY ./db/migrate.js ./migrate.js

# Copy and set up entrypoint script
COPY ./db/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose PostgreSQL port
EXPOSE 5432

# Switch back to postgres user (this is the default user in the postgres image)
# The official postgres entrypoint script will handle permissions correctly
USER postgres

# Use our custom entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
