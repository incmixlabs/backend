import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"
import Postgrator from "postgrator"

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const client = new pg.Client({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.HOSTNAME,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
  })

  try {
    await client.connect()

    const postgrator = new Postgrator({
      migrationPattern: `${__dirname}/api-migrations/*`,
      driver: "pg",
      database: process.env.POSTGRES_DB,
      schemaTable: "schema_version",
      execQuery: (query) => client.query(query),
      // execSqlScript: (sqlScript) => client.(sqlScript),
    })

    const maxVersion = await postgrator.getMaxVersion()
    const runnableMigrations = await postgrator.getRunnableMigrations(
      `${maxVersion}`
    )

    runnableMigrations.forEach((migration) => {
      console.log(
        "Runnable migration: Version:",
        migration.version,
        migration.name
      )
    })

    const appliedMigrations = await postgrator.migrate(`${maxVersion}`)

    appliedMigrations.forEach((migration) => {
      console.log(
        "Applied migration: Version:",
        migration.version,
        migration.name
      )
    })
  } catch (error) {
    console.log(error)
    const migrationError = error

    console.error("Applied migrations:", migrationError.appliedMigrations)
  }

  await client.end()
}
main()
