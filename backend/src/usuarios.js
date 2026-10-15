import { pool } from "./db.js";
import { hashPassword } from "./auth.js";

const SELECT_USUARIO = `
  SELECT u.id, u.nombre, u.email, u.password_hash, u.avatar_url, u.creado_en, r.nombre AS rol
  FROM usuario u
  JOIN rol r ON r.id = u.rol_id
`;

// Forma pública del usuario: coincide con el tipo User del front
export function toPublicUser(row) {
  return {
    id: row.id,
    name: row.nombre,
    email: row.email,
    role: row.rol,
    avatar: row.avatar_url ?? undefined,
    createdAt: row.creado_en.toISOString().slice(0, 10),
  };
}

export async function findUserById(id) {
  const { rows } = await pool.query(`${SELECT_USUARIO} WHERE u.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findUserByEmail(email) {
  const { rows } = await pool.query(`${SELECT_USUARIO} WHERE u.email = $1`, [email.toLowerCase()]);
  return rows[0] ?? null;
}

export async function listUsers() {
  const { rows } = await pool.query(`${SELECT_USUARIO} ORDER BY u.creado_en DESC`);
  return rows;
}

// Lanza un error con code "23505" si el email ya existe
export async function createUser({ nombre, email, password, rol = "visitante" }) {
  const passwordHash = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO usuario (nombre, email, password_hash, rol_id)
     VALUES ($1, $2, $3, (SELECT id FROM rol WHERE nombre = $4))
     RETURNING id`,
    [nombre, email.toLowerCase(), passwordHash, rol]
  );
  return findUserById(rows[0].id);
}

export async function setUserRole(id, rol) {
  const { rowCount } = await pool.query(
    "UPDATE usuario SET rol_id = (SELECT id FROM rol WHERE nombre = $2) WHERE id = $1",
    [id, rol]
  );
  return rowCount > 0 ? findUserById(id) : null;
}

// Crea el admin inicial definido por ADMIN_EMAIL / ADMIN_PASSWORD si aún no existe
export async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;
  if (await findUserByEmail(ADMIN_EMAIL)) return;
  await createUser({
    nombre: ADMIN_NAME || "Guardaparques",
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    rol: "admin",
  });
  console.log(`Admin inicial creado: ${ADMIN_EMAIL}`);
}
