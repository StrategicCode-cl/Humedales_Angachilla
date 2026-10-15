import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Falta la variable de entorno JWT_SECRET");
}

export const SESSION_COOKIE = "sesion";
const SESSION_DAYS = 7;

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  // En producción detrás de HTTPS debe ser true
  secure: process.env.COOKIE_SECURE === "true",
  maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  path: "/",
};

// Formato guardado: scrypt$<salt hex>$<hash hex>
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [algo, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}

export function signSession(userId) {
  return jwt.sign({}, JWT_SECRET, { subject: userId, expiresIn: `${SESSION_DAYS}d` });
}

// Lee el token de la cookie (web) o del header Authorization (app móvil).
// Deja req.userId definido si la sesión es válida.
export function readSession(req, _res, next) {
  const header = req.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.[SESSION_COOKIE];
  if (token) {
    try {
      req.userId = jwt.verify(token, JWT_SECRET).sub;
    } catch {
      // Token vencido o inválido: se trata como visitante anónimo
    }
  }
  next();
}
