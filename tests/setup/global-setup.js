import "../../env.js";
import { execSync } from "node:child_process";
import { Client } from "pg";

async function ensureTestDatabaseExists() {
  if (!process.env.DATABASE_URL_TEST) {
    throw new Error("Missing DATABASE_URL_TEST in environment");
  }

  const testUrl = new URL(process.env.DATABASE_URL_TEST);
  const dbName = testUrl.pathname.replace("/", "");

  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
    throw new Error("DATABASE_URL_TEST database name contains invalid characters");
  }

  const adminUrl = new URL(process.env.DATABASE_URL_TEST);
  adminUrl.pathname = "/postgres";

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();

  const existsResult = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (existsResult.rowCount === 0) {
    try {
      await client.query(`CREATE DATABASE "${dbName}"`);
    } catch (error) {
      if (error.code !== "42P04") {
        throw error;
      }
    }
  }

  await client.end();
}

export default async function globalSetup() {
  await ensureTestDatabaseExists();

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL_TEST,
    },
  });
}
