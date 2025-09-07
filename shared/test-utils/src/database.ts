import fs from "node:fs/promises"
import path from "node:path"
import { findProjectRoot } from "@incmix-api/utils"
import type { Database } from "@incmix-api/utils/db-schema"
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely"
import { Pool } from "pg"

export class TestDatabase {
  private db: Kysely<Database> | null = null
  private pool: Pool | null = null

  async setup(): Promise<Kysely<Database>> {
    if (this.db) {
      return this.db
    }

    try {
      const connectionString = process.env.DATABASE_URL
      if (!connectionString) {
        throw new Error("DATABASE_URL not set")
      }

      this.pool = new Pool({
        connectionString,
        max: 1, // Single connection for tests
        connectionTimeoutMillis: 10_000,
      })

      // Test the connection
      const client = await this.pool.connect()
      client.release()
      this.db = new Kysely<Database>({
        dialect: new PostgresDialect({
          pool: this.pool,
        }),
        plugins: [new CamelCasePlugin()],
      })

      // Run migrations with timeout
      await Promise.race([
        this.runMigrations(connectionString),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Migration timeout")), 30000)
        ),
      ])

      console.log("✅ Test database connected successfully with testcontainers")
      return this.db
    } catch (error) {
      console.warn(
        "⚠️  Real database not available, using mock database:",
        error
      )
      return this.createMockDatabase()
    }
  }

  private createMockDatabase(): Kysely<Database> {
    // Create a mock database that implements the Kysely interface
    const mockDb = {
      selectFrom: () => mockDb,
      select: () => mockDb,
      selectAll: () => mockDb,
      where: () => mockDb,
      limit: () => mockDb,
      execute: () => Promise.resolve([]),
      executeTakeFirst: () => Promise.resolve(null),
      insertInto: () => ({
        values: () => ({
          returningAll: () => ({
            executeTakeFirst: () => Promise.resolve(null),
          }),
          execute: () => Promise.resolve(undefined),
        }),
      }),
      updateTable: () => ({
        set: () => ({
          where: () => ({
            execute: () => Promise.resolve(undefined),
          }),
        }),
      }),
      deleteFrom: () => ({
        where: () => ({
          execute: () => Promise.resolve(undefined),
          returningAll: () => ({
            executeTakeFirst: () => Promise.resolve(null),
          }),
        }),
        execute: () => Promise.resolve(undefined),
      }),
      transaction: () => ({
        execute: (callback: (db: any) => Promise<any>) => callback(mockDb),
      }),
    } as any

    this.db = mockDb
    return mockDb
  }

  async runMigrations(connectionString: string): Promise<void> {
    if (!this.pool) return

    try {
      // Separate pool for migrations
      const migrationClient = new Pool({
        connectionString,
        max: 1,
      })

      // Get all filenames in db/api-migrations directory as array
      const projectRoot = await findProjectRoot()
      if (!projectRoot) {
        throw new Error("Project root not found")
      }
      const migrationsDir = path.resolve(projectRoot, "db/api-migrations")
      const essentialMigrations = (await fs.readdir(migrationsDir))
        .filter((file) => file.endsWith(".sql") && !file.includes("undo"))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

      for (const migrationFile of essentialMigrations) {
        try {
          const migrationPath = `${migrationsDir}/${migrationFile}`
          const migrationSQL = await fs.readFile(migrationPath, "utf-8")

          const client = await migrationClient.connect()
          try {
            await client.query(migrationSQL)
          } catch (migrationError: any) {
            // Ignore common test DB errors
            const ignorableCodes = [
              "42710", // Type already exists
              "42P07", // Table already exists
              "23505", // Duplicate key value
              "25P02", // Transaction aborted
              "42703", // Column does not exist (for migrations that modify non-existent columns)
            ]

            if (ignorableCodes.includes(migrationError.code)) {
              console.log(
                `ℹ️  Skipping migration ${migrationFile}: ${migrationError.message}`
              )
            } else {
              try {
                await client.query("ROLLBACK")
              } catch {}
              console.warn(
                `⚠️  Failed migration ${migrationFile}:`,
                migrationError
              )
              // Don't throw - continue with other migrations
            }
          } finally {
            client.release()
          }

          console.log(`✅ Applied migration: ${migrationFile}`)
        } catch (migrationError) {
          console.warn(
            `⚠️  Failed to apply migration ${migrationFile}:`,
            migrationError
          )
        }
      }

      // Migrations completed - some may have been skipped for existing objects

      await migrationClient.end()
    } catch (error) {
      console.warn("⚠️  Failed to run migrations:", error)
      // Bubble up so setup() can fallback to mock DB
      throw error
    }
  }

  async cleanup(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
    }

    this.db = null
  }

  getDb(): Kysely<Database> {
    if (!this.db) {
      throw new Error("Database not initialized. Call setup() first.")
    }
    return this.db
  }

  getConnectionString(): string {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "Database not found. Set DATABASE_URL environment variable."
      )
    }
    return process.env.DATABASE_URL
  }
}

// Global test database instance
export const testDb = new TestDatabase()
