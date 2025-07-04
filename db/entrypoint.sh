#!/bin/bash
set -e

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    echo "Waiting for PostgreSQL to be ready..."

    # Wait for PostgreSQL to start accepting connections
    until pg_isready -h localhost -p 5432 -U "$POSTGRES_USER"; do
        echo "PostgreSQL is not ready yet. Waiting..."
        sleep 2
    done

    echo "PostgreSQL is ready!"
}

# Function to run migrations
run_migrations() {
    echo "Running database migrations..."

    # Set default values for environment variables if not provided
    export HOSTNAME=${HOSTNAME:-localhost}
    export POSTGRES_PORT=${POSTGRES_PORT:-5432}
    export POSTGRES_DB=${POSTGRES_DB:-postgres}
    export POSTGRES_USER=${POSTGRES_USER:-postgres}
    export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-}

    # Change to app directory where migrate.js is located
    cd /app

    # Run migrations
    if node migrate.js; then
        echo "Migrations completed successfully!"
    else
        echo "Migration failed!"
        exit 1
    fi
}

# Main execution
echo "Starting PostgreSQL with migrations..."

# Start PostgreSQL in the background
echo "Starting PostgreSQL..."
exec docker-entrypoint.sh postgres &

# Wait for PostgreSQL to be ready
wait_for_postgres

# Run migrations
run_migrations

echo "PostgreSQL is running with migrations applied."
echo "Container is ready!"

# Wait for the PostgreSQL process
wait $!
