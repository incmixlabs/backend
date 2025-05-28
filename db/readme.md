# Database Documentation

This directory contains the database configuration and migrations for the Incmix application.

## Directory Structure

- `Dockerfile` - PostgreSQL 17 configuration with plpython3u extension
- `migrations/` - SQL migration files for database schema
- `api-migrations/` - SQL migration files for api services
- `readme.md` - This documentation file

## Database Setup

The database runs in a Docker container with the following configuration:

### Technical Specifications
- PostgreSQL 17
- plpython3u extension enabled
- Port: 54321 (mapped to container port 5432)

### Default Credentials
- Database: incmix
- User: postgres
- Password: password

### Starting the Database
To start the database container, run:
```bash
docker compose up -d
```

To verify the database is running:
```bash
docker compose ps
```

### Connecting to the Database
You can connect to the database using any PostgreSQL client with these connection details:
```
Host: localhost
Port: 54321
Database: incmix
Username: postgres
Password: password
```

## Database Migrations

Migrations are managed using raw SQL scripts and executed using Postgrator. The migration files are stored in the `api-migrations/` directory and follow a sequential naming pattern.

### Running Migrations
To run all pending migrations:
```bash
pnpm migrate
```

### Migration File Naming Convention
Migration files should follow this pattern:
```
[version].do.[optional-description-of-script].sql
```
Example: `001.do.initial-schema.sql`

The pattern consists of:
- `[version]`: Sequential number (e.g., 001, 002)
- `do`: Indicates this is a migration to be executed
- `[optional-description]`: Brief description of what the migration does
- `.sql`: File extension


## Troubleshooting

### Common Issues
1. **Port Conflict**: If port 54321 is already in use, modify the port mapping in docker-compose.yml
2. **Migration Failures**: Check the migration logs and ensure all dependencies are met
3. **Connection Issues**: Verify the database container is running and credentials are correct

### Useful Commands
```bash
# View database logs
docker compose logs db

# Restart database
docker compose restart db

# Reset database (CAUTION: This will delete all data)
docker compose down -v
docker compose up -d
```

## Contributing

When adding new migrations:
1. Create a new migration file in the `api-migrations/` directory
2. Follow the naming convention
3. Test the migration locally
4. Update this documentation if necessary

