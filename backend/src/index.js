import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { migrate } from "./migrate.js";
import { readSession } from "./auth.js";
import { seedAdmin } from "./usuarios.js";
import { authRouter } from "./routes/auth.js";
import { usuariosRouter } from "./routes/usuarios.js";

const PORT = process.env.PORT ?? 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";

const app = express();

// credentials: el front envía la cookie de sesión en peticiones a otro puerto
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(readSession);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/usuarios", usuariosRouter);

app.use((err, _req, res, _next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON inválido" });
  }
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

await migrate();
await seedAdmin();

app.listen(PORT, () => {
  console.log(`API escuchando en el puerto ${PORT}`);
});
