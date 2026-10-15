import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("Falta la variable de entorno DATABASE_URL");
}

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
