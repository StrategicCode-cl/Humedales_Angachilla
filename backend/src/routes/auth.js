import { Router } from "express";
import {
  SESSION_COOKIE,
  hashPassword,
  sessionCookieOptions,
  signSession,
  verifyPassword,
} from "../auth.js";
import {
  USERNAME_RE,
  createUser,
  findUserById,
  findUserByLogin,
  findUserByUsername,
  normalizeUsername,
  toPublicUser,
} from "../usuarios.js";
import { consumeResetToken, createResetToken } from "../recuperacion.js";
import { sendMail } from "../mailer.js";

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
// Dirección del front a la que apunta el enlace del correo de recuperación
const APP_URL = (process.env.APP_URL || process.env.CORS_ORIGIN || "http://localhost:3000").replace(/\/$/, "");
// Nombres que podrían hacerse pasar por la organización
const RESERVED_USERNAMES = new Set(["admin", "administrador", "guardaparques", "comite", "angachilla", "humedal", "soporte"]);

// Hash de relleno para que un email inexistente tarde lo mismo que uno válido
const dummyHash = await hashPassword("contraseña-de-relleno");

function startSession(res, user) {
  res.cookie(SESSION_COOKIE, signSession(user.id), sessionCookieOptions);
}

function usernameProblem(username) {
  if (!USERNAME_RE.test(username)) {
    return "El usuario debe tener entre 3 y 30 caracteres: letras minúsculas, números, punto o guion bajo";
  }
  if (RESERVED_USERNAMES.has(username)) return "Ese nombre de usuario está reservado";
  return null;
}

authRouter.get("/username-available", async (req, res) => {
  const username = normalizeUsername(req.query.u);
  const problem = usernameProblem(username);
  if (problem) return res.json({ available: false, reason: problem });
  const taken = await findUserByUsername(username);
  res.json(taken ? { available: false, reason: "Ese nombre de usuario ya está en uso" } : { available: true });
});

authRouter.post("/register", async (req, res) => {
  const nombre = String(req.body?.name ?? "").trim();
  const apellido = String(req.body?.lastName ?? "").trim() || null;
  const usuario = normalizeUsername(req.body?.username);
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  if (nombre.length < 2 || nombre.length > 100) {
    return res.status(400).json({ error: "El nombre debe tener entre 2 y 100 caracteres" });
  }
  if (apellido && apellido.length > 100) {
    return res.status(400).json({ error: "El apellido puede tener hasta 100 caracteres" });
  }
  const problem = usernameProblem(usuario);
  if (problem) return res.status(400).json({ error: problem, field: "username" });
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "El correo no es válido", field: "email" });
  }
  if (password.length < MIN_PASSWORD) {
    return res.status(400).json({ error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`, field: "password" });
  }

  try {
    const user = await createUser({ nombre, apellido, usuario, email, password });
    startSession(res, user);
    res.status(201).json({ user: toPublicUser(user) });
  } catch (err) {
    if (err.code === "23505") {
      return err.constraint === "usuario_usuario_key"
        ? res.status(409).json({ error: "Ese nombre de usuario ya está en uso", field: "username" })
        : res.status(409).json({ error: "Ya existe una cuenta con ese correo", field: "email" });
    }
    throw err;
  }
});

// Acepta { identifier } (correo o usuario); { email } se mantiene por compatibilidad con la app móvil
authRouter.post("/login", async (req, res) => {
  const identifier = String(req.body?.identifier ?? req.body?.email ?? "").trim();
  const password = String(req.body?.password ?? "");

  const user = identifier ? await findUserByLogin(identifier) : null;
  const ok = await verifyPassword(password, user?.password_hash ?? dummyHash);
  if (!user || !ok) {
    return res.status(401).json({ error: "Usuario, correo o contraseña incorrectos" });
  }

  startSession(res, user);
  res.json({ user: toPublicUser(user) });
});

// Responde siempre lo mismo, exista o no la cuenta, para no revelar qué correos están registrados
authRouter.post("/forgot-password", async (req, res) => {
  const identifier = String(req.body?.identifier ?? req.body?.email ?? "").trim();
  const user = identifier ? await findUserByLogin(identifier) : null;

  if (user) {
    const reset = await createResetToken(user.id);
    if (reset) {
      const link = `${APP_URL}/restablecer-clave?token=${reset.token}`;
      const text = [
        `Hola ${user.nombre}:`,
        "",
        "Recibimos una solicitud para cambiar la contraseña de tu cuenta en Angachilla App.",
        `Abre este enlace para elegir una nueva (vence en ${reset.minutes} minutos):`,
        link,
        "",
        "Si no fuiste tú, ignora este correo: tu contraseña no cambiará.",
      ].join("\n");
      sendMail({ to: user.email, subject: "Cambia tu contraseña de Angachilla App", text }).catch((err) =>
        console.error("No se pudo enviar el correo de recuperación:", err.message)
      );
    }
  }

  res.json({ ok: true });
});

authRouter.post("/reset-password", async (req, res) => {
  const token = String(req.body?.token ?? "");
  const password = String(req.body?.password ?? "");

  if (password.length < MIN_PASSWORD) {
    return res.status(400).json({ error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres` });
  }
  const userId = token ? await consumeResetToken(token, password) : null;
  if (!userId) {
    return res.status(400).json({ error: "El enlace no es válido o ya venció. Pide uno nuevo." });
  }

  const user = await findUserById(userId);
  startSession(res, user);
  res.json({ user: toPublicUser(user) });
});

authRouter.post("/logout", (_req, res) => {
  const { maxAge: _maxAge, ...options } = sessionCookieOptions;
  res.clearCookie(SESSION_COOKIE, options);
  res.status(204).end();
});

authRouter.get("/me", async (req, res) => {
  const user = req.userId ? await findUserById(req.userId) : null;
  res.json({ user: user ? toPublicUser(user) : null });
});
