import { pool } from "./db.js";
import { hashPassword } from "./auth.js";

const SELECT_USUARIO = `
  SELECT u.id, u.nombre, u.apellido, u.usuario, u.email, u.password_hash, u.avatar_url, u.creado_en, r.nombre AS rol
  FROM usuario u
  JOIN rol r ON r.id = u.rol_id
`;

export const USERNAME_RE = /^[a-z0-9._]{3,30}$/;

// "@Sofia.C " -> "sofia.c"
export function normalizeUsername(value) {
  return String(value ?? "").trim().replace(/^@+/, "").toLowerCase();
}

// Forma pública del usuario: coincide con el tipo User del front
export function toPublicUser(row) {
  return {
    id: row.id,
    name: row.nombre,
    lastName: row.apellido ?? undefined,
    username: row.usuario,
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

export async function findUserByUsername(username) {
  const { rows } = await pool.query(`${SELECT_USUARIO} WHERE u.usuario = $1`, [normalizeUsername(username)]);
  return rows[0] ?? null;
}

// Inicio de sesión con correo o con usuario: un usuario nunca lleva @ en el medio
export function findUserByLogin(identifier) {
  const value = String(identifier ?? "").trim();
  if (!value) return null;
  return /^[^@]+@[^@]+$/.test(value) ? findUserByEmail(value) : findUserByUsername(value);
}

export async function listUsers() {
  const { rows } = await pool.query(`${SELECT_USUARIO} ORDER BY u.creado_en DESC`);
  return rows;
}

// Lanza un error con code "23505" si el email o el usuario ya existen (err.constraint dice cuál)
export async function createUser({ nombre, apellido = null, usuario, email, password, rol = "visitante" }) {
  const passwordHash = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO usuario (nombre, apellido, usuario, email, password_hash, rol_id)
     VALUES ($1, $2, $3, $4, $5, (SELECT id FROM rol WHERE nombre = $6))
     RETURNING id`,
    [nombre, apellido, normalizeUsername(usuario), email.toLowerCase(), passwordHash, rol]
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

// Primer usuario libre a partir de una base: "guardaparques", "guardaparques2", ...
async function freeUsername(base) {
  const clean = normalizeUsername(base).replace(/[^a-z0-9._]/g, "").slice(0, 26) || "usuario";
  const root = clean.length < 3 ? `${clean}usr` : clean;
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? root : `${root}${n}`;
    if (!(await findUserByUsername(candidate))) return candidate;
  }
}

// Crea el admin inicial definido por ADMIN_EMAIL / ADMIN_PASSWORD si aún no existe
export async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;
  if (await findUserByEmail(ADMIN_EMAIL)) return;
  await createUser({
    nombre: ADMIN_NAME || "Guardaparques",
    usuario: await freeUsername(ADMIN_EMAIL.split("@")[0]),
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    rol: "admin",
  });
  console.log(`Admin inicial creado: ${ADMIN_EMAIL}`);
}
