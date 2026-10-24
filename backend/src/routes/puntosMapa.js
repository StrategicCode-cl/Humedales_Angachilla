import { Router } from "express";
import { pool } from "../db.js";
import { findUserById } from "../usuarios.js";
import { upsertMediaBuffer } from "./media.js";

// Puntos del mapa (vista / actividad) y corrección de ubicación de los tótems
export const puntosMapaRouter = Router();

const TIPOS = ["vista", "actividad"];
const ICONO_RE = /^[a-z0-9-]{2,40}$/;
// Caja amplia alrededor de Valdivia: evita guardar un punto en otro lugar por un error de tipeo
const BOUNDS = { latMin: -40.2, latMax: -39.5, lngMin: -73.6, lngMax: -72.9 };

async function requireAdmin(req, res) {
  const user = req.userId ? await findUserById(req.userId) : null;
  if (!user || user.rol !== "admin") {
    res.status(403).json({ error: "Se requieren permisos de administrador" });
    return null;
  }
  return user;
}

// [lat, lng] válidos dentro de la zona, o null
function readCoordinates(b) {
  const lat = Number(b?.coordinates?.[0] ?? b?.lat);
  const lng = Number(b?.coordinates?.[1] ?? b?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < BOUNDS.latMin || lat > BOUNDS.latMax || lng < BOUNDS.lngMin || lng > BOUNDS.lngMax) return null;
  return [lat, lng];
}

async function saveImage(dataUrl, nombre) {
  const m = String(dataUrl || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return null;
  const saved = await upsertMediaBuffer({
    buffer: Buffer.from(m[2], "base64"),
    mimeType: m[1],
    nombreOriginal: `${nombre}.jpg`,
    categoria: "punto_mapa",
  });
  return saved.id;
}

const SELECT_PUNTO = `
  SELECT p.id, p.nombre, p.tipo, p.icono, p.descripcion, p.lat, p.lng, p.publicado,
         p.creado_en, p.actualizado_en,
         s.slug AS ruta_slug, s.nombre AS ruta_nombre,
         e.id AS evento_id, e.titulo AS evento_titulo,
         p.imagen_id, ia.slug AS imagen_slug
  FROM punto_mapa p
  LEFT JOIN sendero s ON s.id = p.sendero_id
  LEFT JOIN evento e ON e.id = p.evento_id
  LEFT JOIN imagen_archivo ia ON ia.id = p.imagen_id
`;

function toPublic(r) {
  return {
    id: r.id,
    name: r.nombre,
    type: r.tipo,
    icon: r.icono,
    description: r.descripcion,
    coordinates: [Number(r.lat), Number(r.lng)],
    routeId: r.ruta_slug ?? null,
    routeName: r.ruta_nombre ?? null,
    eventId: r.evento_id ?? null,
    eventTitle: r.evento_titulo ?? null,
    image: r.imagen_id ? (r.imagen_slug ? `/api/media/slug/${r.imagen_slug}` : `/api/media/${r.imagen_id}`) : null,
    published: r.publicado,
    updatedAt: r.actualizado_en,
  };
}

async function findPunto(id) {
  const { rows } = await pool.query(`${SELECT_PUNTO} WHERE p.id = $1`, [id]);
  return rows[0] ? toPublic(rows[0]) : null;
}

// Visitantes: solo publicados. Guardaparques con ?todos=1: también los borradores.
puntosMapaRouter.get("/puntos-mapa", async (req, res) => {
  let todos = false;
  if (req.query.todos === "1") {
    const user = req.userId ? await findUserById(req.userId) : null;
    todos = user?.rol === "admin";
  }
  const { rows } = await pool.query(
    `${SELECT_PUNTO} ${todos ? "" : "WHERE p.publicado"} ORDER BY p.tipo, p.nombre`
  );
  res.json({ points: rows.map(toPublic) });
});

puntosMapaRouter.post("/puntos-mapa", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const b = req.body ?? {};
  const nombre = String(b.name ?? "").trim();
  const tipo = String(b.type ?? "");
  const icono = String(b.icon ?? "binoculars");
  const coords = readCoordinates(b);

  if (nombre.length < 2 || nombre.length > 120) return res.status(400).json({ error: "El nombre debe tener entre 2 y 120 caracteres" });
  if (!TIPOS.includes(tipo)) return res.status(400).json({ error: "Tipo de punto no válido" });
  if (!ICONO_RE.test(icono)) return res.status(400).json({ error: "Ícono no válido" });
  if (!coords) return res.status(400).json({ error: "La ubicación está fuera de la zona de la reserva" });

  const imagenId = await saveImage(b.image, `punto-${Date.now()}`);
  const { rows } = await pool.query(
    `INSERT INTO punto_mapa (nombre, tipo, icono, descripcion, ubicacion, lat, lng, sendero_id, evento_id, imagen_id, publicado)
     VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($6, $5), 4326), $5, $6,
             (SELECT id FROM sendero WHERE slug = $7), $8, $9, $10)
     RETURNING id`,
    [
      nombre,
      tipo,
      icono,
      String(b.description ?? "").slice(0, 2000),
      coords[0],
      coords[1],
      b.routeId || null,
      tipo === "actividad" && b.eventId ? String(b.eventId) : null,
      imagenId,
      b.published !== false,
    ]
  );
  res.status(201).json({ point: await findPunto(rows[0].id) });
});

puntosMapaRouter.put("/puntos-mapa/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const id = String(req.params.id);
  const b = req.body ?? {};
  const nombre = String(b.name ?? "").trim();
  const tipo = String(b.type ?? "");
  const icono = String(b.icon ?? "");

  if (nombre.length < 2 || nombre.length > 120) return res.status(400).json({ error: "El nombre debe tener entre 2 y 120 caracteres" });
  if (!TIPOS.includes(tipo)) return res.status(400).json({ error: "Tipo de punto no válido" });
  if (!ICONO_RE.test(icono)) return res.status(400).json({ error: "Ícono no válido" });

  const imagenId = await saveImage(b.image, `punto-${id}`);
  const { rowCount } = await pool.query(
    `UPDATE punto_mapa SET
       nombre = $2, tipo = $3, icono = $4, descripcion = $5,
       sendero_id = (SELECT id FROM sendero WHERE slug = $6),
       evento_id = $7,
       imagen_id = CASE WHEN $9 THEN NULL ELSE COALESCE($8, imagen_id) END,
       publicado = $10,
       actualizado_en = now()
     WHERE id = $1`,
    [
      id,
      nombre,
      tipo,
      icono,
      String(b.description ?? "").slice(0, 2000),
      b.routeId || null,
      tipo === "actividad" && b.eventId ? String(b.eventId) : null,
      imagenId,
      b.image === null,
      b.published !== false,
    ]
  ).catch((err) => {
    if (err.code === "22P02") return { rowCount: 0 };
    throw err;
  });
  if (!rowCount) return res.status(404).json({ error: "Punto no encontrado" });
  res.json({ point: await findPunto(id) });
});

// Solo la ubicación: para corregir un punto bien descrito pero mal ubicado
puntosMapaRouter.patch("/puntos-mapa/:id/ubicacion", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const coords = readCoordinates(req.body);
  if (!coords) return res.status(400).json({ error: "La ubicación está fuera de la zona de la reserva" });
  const { rowCount } = await pool.query(
    `UPDATE punto_mapa SET ubicacion = ST_SetSRID(ST_MakePoint($3, $2), 4326), lat = $2, lng = $3, actualizado_en = now()
     WHERE id = $1`,
    [String(req.params.id), coords[0], coords[1]]
  ).catch((err) => {
    if (err.code === "22P02") return { rowCount: 0 };
    throw err;
  });
  if (!rowCount) return res.status(404).json({ error: "Punto no encontrado" });
  res.json({ point: await findPunto(String(req.params.id)) });
});

puntosMapaRouter.delete("/puntos-mapa/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  await pool.query("DELETE FROM punto_mapa WHERE id = $1", [String(req.params.id)]).catch((err) => {
    if (err.code !== "22P02") throw err;
  });
  res.status(204).end();
});

// Corrige la ubicación de un tótem y la protege de la carga inicial de datos
puntosMapaRouter.patch("/estaciones/:id/ubicacion", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const coords = readCoordinates(req.body);
  if (!coords) return res.status(400).json({ error: "La ubicación está fuera de la zona de la reserva" });
  const { rowCount } = await pool.query(
    `UPDATE estacion SET ubicacion = ST_SetSRID(ST_MakePoint($3, $2), 4326), lat = $2, lng = $3, ubicacion_editada = true
     WHERE id = $1`,
    [String(req.params.id), coords[0], coords[1]]
  ).catch((err) => {
    if (err.code === "22P02") return { rowCount: 0 };
    throw err;
  });
  if (!rowCount) return res.status(404).json({ error: "Tótem no encontrado" });
  res.json({ ok: true, coordinates: coords });
});
