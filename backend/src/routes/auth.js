import { Router } from "express";
import {
  SESSION_COOKIE,
  hashPassword,
  sessionCookieOptions,
  signSession,
  verifyPassword,
} from "../auth.js";
import { createUser, findUserByEmail, findUserById, toPublicUser } from "../usuarios.js";

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

// Hash de relleno para que un email inexistente tarde lo mismo que uno válido
const dummyHash = await hashPassword("contraseña-de-relleno");

function startSession(res, user) {
  res.cookie(SESSION_COOKIE, signSession(user.id), sessionCookieOptions);
}

authRouter.post("/register", async (req, res) => {
  const nombre = String(req.body?.name ?? "").trim();
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  if (nombre.length < 2 || nombre.length > 100) {
    return res.status(400).json({ error: "El nombre debe tener entre 2 y 100 caracteres" });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "El correo no es válido" });
  }
  if (password.length < MIN_PASSWORD) {
    return res.status(400).json({ error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres` });
  }

  try {
    const user = await createUser({ nombre, email, password });
    startSession(res, user);
    res.status(201).json({ user: toPublicUser(user) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Ya existe una cuenta con ese correo" });
    }
    throw err;
  }
});

authRouter.post("/login", async (req, res) => {
  const email = String(req.body?.email ?? "").trim();
  const password = String(req.body?.password ?? "");

  const user = email ? await findUserByEmail(email) : null;
  const ok = await verifyPassword(password, user?.password_hash ?? dummyHash);
  if (!user || !ok) {
    return res.status(401).json({ error: "Correo o contraseña incorrectos" });
  }

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
