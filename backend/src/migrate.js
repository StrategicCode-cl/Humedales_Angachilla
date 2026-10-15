import { readdir, readFile } from "node:fs/promises";
import { pool } from "./db.js";

const MIGRATIONS_DIR = new URL("../migrations/", import.meta.url);

// Aplica en orden los archivos migrations/*.sql que aún no se han ejecutado.
// Cada migración corre en su propia transacción.
export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migracion (
      nombre      TEXT PRIMARY KEY,
      aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await pool.query("SELECT nombre FROM migracion");
  const applied = new Set(rows.map((r) => r.nombre));
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(new URL(file, MIGRATIONS_DIR), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO migracion (nombre) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`Migración aplicada: ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`Falló la migración ${file}: ${err.message}`, { cause: err });
    } finally {
      client.release();
    }
  }
}
