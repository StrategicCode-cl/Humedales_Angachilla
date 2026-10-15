import { Router } from "express";
import { findUserById, listUsers, setUserRole, toPublicUser } from "../usuarios.js";

export const usuariosRouter = Router();

const ROLES = ["visitante", "admin"];

// Todas las rutas de /api/usuarios son solo para administradores
usuariosRouter.use(async (req, res, next) => {
  const user = req.userId ? await findUserById(req.userId) : null;
  if (!user) {
    return res.status(401).json({ error: "Debes iniciar sesión" });
  }
  if (user.rol !== "admin") {
    return res.status(403).json({ error: "Solo administradores" });
  }
  next();
});

usuariosRouter.get("/", async (_req, res) => {
  const users = await listUsers();
  res.json({ users: users.map(toPublicUser) });
});

usuariosRouter.patch("/:id/role", async (req, res) => {
  const role = req.body?.role;
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: `El rol debe ser uno de: ${ROLES.join(", ")}` });
  }
  // Evita que el último admin se quite el rol a sí mismo por accidente
  if (req.params.id === req.userId && role !== "admin") {
    return res.status(400).json({ error: "No puedes quitarte tu propio rol de administrador" });
  }

  const user = await setUserRole(req.params.id, role).catch((err) => {
    // id con formato inválido para UUID
    if (err.code === "22P02") return null;
    throw err;
  });
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  res.json({ user: toPublicUser(user) });
});
