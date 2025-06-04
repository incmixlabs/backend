# Use official PostgreSQL 17 base image
FROM postgres:17

# Switch to root user to install packages
USER root

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive



# Install plpython3u extension
RUN apt-get update && apt-get install -y \
    postgresql-plpython3-17 git curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Ensure proper ownership of PostgreSQL directories
RUN chown -R postgres:postgres /var/lib/postgresql \
    && chmod -R 700 /var/lib/postgresql

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



WORKDIR /app

# Create and set permissions for npm global directory
RUN mkdir -p /usr/local/lib/node_modules && \
    chown -R root:root /usr/local/lib/node_modules && \
    chmod -R 755 /usr/local/lib/node_modules && \
    npm install -g pnpm turbo

COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./turbo.json ./

COPY ./db/package.json ./db/

# Ensure proper permissions for npm cache and pnpm store
RUN mkdir -p /root/.npm && \
    mkdir -p /root/.local/share/pnpm/store && \
    pnpm install --frozen-lockfile --prod=false

COPY ./db/api-migrations ./db/api-migrations

COPY ./db/migrations ./db/migrations
COPY ./db/migrate.js ./db/migrate.js

# Expose PostgreSQL port
EXPOSE 5432

# Switch back to postgres user
USER postgres

# Use the default postgres entrypoint
CMD ["postgres"]