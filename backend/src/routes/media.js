import { Router } from "express";
import { createHash } from "node:crypto";
import { pool } from "../db.js";

export const mediaRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveCategoriaImagenId(codigo = "general") {
  const { rows } = await pool.query(
    `SELECT COALESCE(
       (SELECT id FROM categoria_imagen WHERE codigo = $1),
       (SELECT id FROM categoria_imagen WHERE codigo = 'general')
     ) AS id`,
    [codigo]
  );
  return rows[0]?.id ?? 1;
}

export async function upsertMediaBuffer({
  buffer,
  mimeType,
  nombreOriginal,
  categoria = "general",
  slug = null,
  subidoPor = null,
}) {
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const categoriaId = await resolveCategoriaImagenId(categoria);

  // Si ya existe exactamente el mismo binario por sha256 o el mismo slug, actualizamos o reutilizamos
  if (slug) {
    const existingSlug = await pool.query(
      "SELECT id FROM imagen_archivo WHERE slug = $1",
      [slug]
    );
    if (existingSlug.rows[0]) {
      const id = existingSlug.rows[0].id;
      await pool.query(
        `UPDATE imagen_archivo
         SET bytes = $2, mime_type = $3, tamano_bytes = $4, sha256 = $5, nombre_original = $6, categoria_id = $7
         WHERE id = $1`,
        [id, buffer, mimeType, buffer.length, sha256, nombreOriginal, categoriaId]
      );
      return { id, slug };
    }
  }

  const existingSha = await pool.query(
    "SELECT id, slug FROM imagen_archivo WHERE sha256 = $1",
    [sha256]
  );
  if (existingSha.rows[0]) {
    const row = existingSha.rows[0];
    if (slug && !row.slug) {
      await pool.query("UPDATE imagen_archivo SET slug = $2 WHERE id = $1", [row.id, slug]);
    }
    return { id: row.id, slug: slug || row.slug };
  }

  const { rows } = await pool.query(
    `INSERT INTO imagen_archivo (slug, nombre_original, categoria_id, mime_type, bytes, tamano_bytes, sha256, subido_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, slug`,
    [slug, nombreOriginal, categoriaId, mimeType, buffer, buffer.length, sha256, subidoPor]
  );
  return rows[0];
}

// Listar metadatos de recursos multimedia por categoría normalizada (ej: textura_viva, svg_oficial)
mediaRouter.get("/list", async (req, res) => {
  const categoria = req.query.categoria ? String(req.query.categoria) : null;
  const params = [];
  let where = "";
  if (categoria) {
    params.push(categoria);
    where = "WHERE ci.codigo = $1";
  }
  const { rows } = await pool.query(
    `SELECT
       ia.id,
       ia.slug,
       ia.nombre_original,
       ci.codigo AS categoria,
       ci.nombre AS categoria_nombre,
       ia.mime_type,
       ia.tamano_bytes,
       ia.creado_en
     FROM imagen_archivo ia
     JOIN categoria_imagen ci ON ci.id = ia.categoria_id
     ${where}
     ORDER BY ia.nombre_original ASC`,
    params
  );
  res.json({
    items: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.nombre_original,
      category: r.categoria,
      categoryName: r.categoria_nombre,
      mimeType: r.mime_type,
      sizeBytes: r.tamano_bytes,
      url: r.slug ? `/api/media/slug/${r.slug}` : `/api/media/${r.id}`,
    })),
  });
});

// Servir archivo binario por slug amigable
mediaRouter.get("/slug/:slug", async (req, res) => {
  const slug = String(req.params.slug);
  const { rows } = await pool.query(
    "SELECT mime_type, bytes, sha256 FROM imagen_archivo WHERE slug = $1",
    [slug]
  );
  const row = rows[0];
  if (!row) {
    return res.status(404).json({ error: "Recurso multimedia no encontrado" });
  }
  res.setHeader("Content-Type", row.mime_type);
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("ETag", `"${row.sha256}"`);
  if (req.headers["if-none-match"] === `"${row.sha256}"`) {
    return res.status(304).end();
  }
  res.send(row.bytes);
});

// Servir archivo binario por UUID
mediaRouter.get("/:id", async (req, res) => {
  const id = String(req.params.id);
  if (!UUID_RE.test(id)) {
    return res.status(400).json({ error: "ID de imagen inválido" });
  }
  const { rows } = await pool.query(
    "SELECT mime_type, bytes, sha256 FROM imagen_archivo WHERE id = $1",
    [id]
  );
  const row = rows[0];
  if (!row) {
    return res.status(404).json({ error: "Imagen no encontrada" });
  }
  res.setHeader("Content-Type", row.mime_type);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("ETag", `"${row.sha256}"`);
  if (req.headers["if-none-match"] === `"${row.sha256}"`) {
    return res.status(304).end();
  }
  res.send(row.bytes);
});

// Subir imagen en Base64 / DataURL directamente a la base de datos PostgreSQL
mediaRouter.post("/", async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Debes iniciar sesión para subir imágenes" });
  }

  const dataUrl = String(req.body?.dataUrl ?? "");
  const nombreOriginal = String(req.body?.filename ?? "subida-usuario.jpg").slice(0, 180);
  const categoria = String(req.body?.categoria ?? "usuario_upload").slice(0, 60);

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return res.status(400).json({ error: "Formato de imagen inválido (se requiere DataURL base64)" });
  }

  const mimeType = match[1].toLowerCase();
  const allowed = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"]);
  if (!allowed.has(mimeType)) {
    return res.status(400).json({ error: "Tipo de imagen no permitido" });
  }

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > 15 * 1024 * 1024) {
    return res.status(413).json({ error: "La imagen supera el tamaño máximo de 15 MB" });
  }

  const saved = await upsertMediaBuffer({
    buffer,
    mimeType: mimeType === "image/jpg" ? "image/jpeg" : mimeType,
    nombreOriginal,
    categoria,
    subidoPor: req.userId,
  });

  res.status(201).json({
    id: saved.id,
    url: `/api/media/${saved.id}`,
  });
});
