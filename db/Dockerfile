# Use official PostgreSQL 17 base image
FROM postgres:17

# Switch to root user to install packages
USER root

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive

# Install plpython3u extension
RUN apt-get update && apt-get install -y \
    postgresql-plpython3-17 \
    && rm -rf /var/lib/apt/lists/*

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

# Switch back to postgres user
USER postgres

# Expose PostgreSQL port
EXPOSE 5432

# Use the default postgres entrypoint
CMD ["postgres"]