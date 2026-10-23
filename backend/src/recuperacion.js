import { createHash, randomBytes } from "node:crypto";
import { pool } from "./db.js";
import { hashPassword } from "./auth.js";

const TOKEN_MINUTES = 60;
// Evita llenar el correo de alguien pidiendo enlaces seguidos
const COOLDOWN_SECONDS = 60;

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

// Devuelve el token en claro para el enlace, o null si ya se pidió uno hace muy poco
export async function createResetToken(userId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM restablecimiento_clave
     WHERE usuario_id = $1 AND creado_en > now() - make_interval(secs => $2)`,
    [userId, COOLDOWN_SECONDS]
  );
  if (rows.length) return null;

  const token = randomBytes(32).toString("base64url");
  await pool.query(
    `INSERT INTO restablecimiento_clave (usuario_id, token_hash, expira_en)
     VALUES ($1, $2, now() + make_interval(mins => $3))`,
    [userId, hashToken(token), TOKEN_MINUTES]
  );
  return { token, minutes: TOKEN_MINUTES };
}

// Cambia la contraseña si el token es válido; lo marca usado junto con los demás pendientes del usuario.
// Devuelve el id del usuario, o null si el enlace no existe, venció o ya se usó.
export async function consumeResetToken(token, newPassword) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT usuario_id FROM restablecimiento_clave
       WHERE token_hash = $1 AND usado_en IS NULL AND expira_en > now()
       FOR UPDATE`,
      [hashToken(token)]
    );
    if (!rows.length) {
      await client.query("ROLLBACK");
      return null;
    }
    const userId = rows[0].usuario_id;
    await client.query("UPDATE usuario SET password_hash = $2 WHERE id = $1", [userId, await hashPassword(newPassword)]);
    await client.query(
      "UPDATE restablecimiento_clave SET usado_en = now() WHERE usuario_id = $1 AND usado_en IS NULL",
      [userId]
    );
    await client.query("COMMIT");
    return userId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
