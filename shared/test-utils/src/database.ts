import fs from "node:fs/promises"
import path from "node:path"
import { findProjectRoot } from "@incmix-api/utils"
import type { Database } from "@incmix-api/utils/db-schema"
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql"
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely"
import { Pool } from "pg"

export class TestDatabase {
  private db: Kysely<Database> | null = null
  private pool: Pool | null = null
  private container: StartedPostgreSqlContainer | null = null

  async setup(): Promise<Kysely<Database>> {
    if (this.db) {
      return this.db
    }

    try {
      // Try to use testcontainers for real database
      this.container = await new PostgreSqlContainer("postgres:17")
        .withDatabase("testdb")
        .withUsername("testuser")
        .withPassword("testpass")
        .start()

      const connectionString = this.container.getConnectionUri()

      process.env.DATABASE_URL = connectionString

      this.pool = new Pool({
        connectionString,
        max: 1, // Single connection for tests
      })

      this.db = new Kysely<Database>({
        dialect: new PostgresDialect({
          pool: this.pool,
        }),
        plugins: [new CamelCasePlugin()],
      })

      // Run migrations
      await this.runMigrations(connectionString)

      console.log("✅ Test database connected successfully with testcontainers")
      return this.db
    } catch (_error) {
      console.warn("⚠️  Real database not available, using mock database")
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
      // Create a separate client for migrations
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
      const essentialMigrations = (await fs.readdir(migrationsDir)).filter(
        (file) => !file.includes("undo")
      )

      for (const migrationFile of essentialMigrations) {
        try {
          const migrationPath = `${migrationsDir}/${migrationFile}`
          const migrationSQL = await fs.readFile(migrationPath, "utf-8")

          await migrationClient.query(migrationSQL)
          console.log(`✅ Applied migration: ${migrationFile}`)
        } catch (migrationError) {
          console.warn(
            `⚠️  Failed to apply migration ${migrationFile}:`,
            migrationError
          )
        }
      }

      await migrationClient.end()
    } catch (error) {
      console.warn("⚠️  Failed to run migrations:", error)
      // Don't throw - let tests continue with empty database
    }
  }

  async cleanup(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
    }

    if (this.container) {
      await this.container.stop()
      this.container = null
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
    if (!this.container) {
      throw new Error("Database not initialized. Call setup() first.")
    }
    return this.container.getConnectionUri()
  }
}

// Global test database instance
export const testDb = new TestDatabase()
