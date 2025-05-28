import Postgrator from "postgrator"
import pg from "pg"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()

    const postgrator = new Postgrator({
      migrationPattern: `${__dirname}/api-migrations/*`,
      driver: "pg",
      database: "incmix",
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
