import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import mysql from "mysql2/promise";

loadEnv();

const migrationsDir = resolve("prisma", "migrations");

function parseDatabaseUrl(rawUrl) {
  if (!rawUrl) throw new Error("DATABASE_URL is not set.");

  const parsed = new URL(rawUrl);
  if (!parsed.protocol.startsWith("mysql")) {
    throw new Error(`Unsupported DATABASE_URL protocol "${parsed.protocol}". Expected mysql://`);
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!database) throw new Error("DATABASE_URL is missing the database name.");

  return {
    host: decodeURIComponent(parsed.hostname) || "localhost",
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
  };
}

async function ensureMigrationsTable(connection) {
  await connection.query(
    `CREATE TABLE IF NOT EXISTS \`_prisma_migrations\` (
      \`id\` VARCHAR(36) NOT NULL,
      \`checksum\` VARCHAR(64) NOT NULL,
      \`finished_at\` TIMESTAMP(3) NULL,
      \`migration_name\` VARCHAR(255) NOT NULL,
      \`logs\` TEXT NULL,
      \`rolled_back_at\` TIMESTAMP(3) NULL,
      \`started_at\` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`applied_steps_count\` INT UNSIGNED NOT NULL DEFAULT 0,
      INDEX \`_prisma_migrations_finished_at_idx\`(\`finished_at\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
}

function readMigrations() {
  if (!existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) => {
      const file = join(migrationsDir, name, "migration.sql");
      if (!existsSync(file)) throw new Error(`Missing migration.sql in ${name}`);
      const sql = readFileSync(file, "utf8");
      return { name, sql, checksum: createHash("sha256").update(sql).digest("hex") };
    });
}

async function main() {
  const target = parseDatabaseUrl(process.env.DATABASE_URL);
  console.log(`[migrate] target ${target.user}@${target.host}:${target.port}/${target.database}`);

  const connection = await mysql.createConnection({
    ...target,
    multipleStatements: true,
    charset: "utf8mb4",
  });

  try {
    await ensureMigrationsTable(connection);
    const [rows] = await connection.query(
      "SELECT migration_name, checksum, finished_at, rolled_back_at FROM _prisma_migrations",
    );

    const done = new Map();
    for (const row of rows) {
      if (row.finished_at && !row.rolled_back_at) done.set(row.migration_name, row.checksum);
      else console.log(`[migrate] retrying previously failed migration ${row.migration_name}`);
    }

    const migrations = readMigrations();
    const pending = migrations.filter((m) => done.get(m.name) !== m.checksum);

    const drifted = migrations.filter((m) => done.has(m.name) && done.get(m.name) !== m.checksum);
    for (const migration of drifted) {
      console.log(`[migrate] WARNING ${migration.name} checksum differs from the applied copy, re-applying`);
    }

    console.log(`[migrate] ${migrations.length} migrations found, ${pending.length} pending`);

    for (const migration of pending) {
      await connection.query(
        "INSERT INTO _prisma_migrations (id, checksum, migration_name, started_at, applied_steps_count) VALUES (?, ?, ?, CURRENT_TIMESTAMP(3), 0)",
        [randomUUID(), migration.checksum, migration.name],
      );

      try {
        await connection.query(migration.sql);
      } catch (error) {
        await connection.query(
          "UPDATE _prisma_migrations SET logs = ? WHERE migration_name = ? AND finished_at IS NULL",
          [String(error.message).slice(0, 2000), migration.name],
        );
        throw new Error(`${migration.name} failed: ${error.message}`);
      }

      await connection.query(
        "UPDATE _prisma_migrations SET finished_at = CURRENT_TIMESTAMP(3), applied_steps_count = 1, logs = NULL WHERE migration_name = ? AND finished_at IS NULL",
        [migration.name],
      );
      console.log(`[migrate] applied ${migration.name}`);
    }

    const [tables] = await connection.query("SHOW TABLES");
    console.log(`[migrate] done -> ${pending.length} applied, database now has ${tables.length} tables`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(`[migrate] ${error.message}`);
  process.exit(1);
});