import { Router } from "express";
import { pool } from "../db.js";
import { findUserById } from "../usuarios.js";
import { upsertMediaBuffer } from "./media.js";

export const ecosistemaRouter = Router();

async function requireAdmin(req, res) {
  const user = req.userId ? await findUserById(req.userId) : null;
  if (!user || user.rol !== "admin") {
    res.status(403).json({ error: "Se requieren permisos de administrador" });
    return null;
  }
  return user;
}

function mediaUrlFromRow(id, slug) {
  if (slug) return `/api/media/slug/${slug}`;
  if (id) return `/api/media/${id}`;
  return "/api/media/slug/estacion-s1-foto-1";
}

// --- 0. CATÁLOGOS NORMALIZADOS Y JERARQUÍA TAXONÓMICA (3FN) ---
ecosistemaRouter.get("/taxonomia", async (_req, res) => {
  const [reinosRes, gruposRes, categoriasRes, estadosRes, catEstRes, catEvRes, catAvRes] =
    await Promise.all([
      pool.query("SELECT * FROM reino_biologico ORDER BY orden ASC"),
      pool.query(`
        SELECT gt.*, rb.codigo AS reino_codigo, rb.nombre AS reino_nombre
        FROM grupo_taxonomico gt
        JOIN reino_biologico rb ON rb.id = gt.reino_id
        ORDER BY gt.orden ASC
      `),
      pool.query(`
        SELECT
          ce.*,
          gt.codigo AS grupo_codigo,
          gt.nombre AS grupo_nombre,
          rb.id AS reino_id,
          rb.codigo AS reino_codigo,
          rb.nombre AS reino_nombre
        FROM categoria_especie ce
        JOIN grupo_taxonomico gt ON gt.id = ce.grupo_id
        JOIN reino_biologico rb ON rb.id = gt.reino_id
        ORDER BY ce.orden ASC
      `),
      pool.query("SELECT * FROM estado_conservacion ORDER BY nivel_amenaza DESC"),
      pool.query("SELECT * FROM categoria_estacion ORDER BY id ASC"),
      pool.query("SELECT * FROM categoria_evento ORDER BY id ASC"),
      pool.query("SELECT * FROM categoria_aviso ORDER BY id ASC"),
    ]);

  res.json({
    reinos: reinosRes.rows,
    grupos: gruposRes.rows,
    categoriasEspecie: categoriasRes.rows,
    estadosConservacion: estadosRes.rows,
    categoriasEstacion: catEstRes.rows,
    categoriasEvento: catEvRes.rows,
    categoriasAviso: catAvRes.rows,
  });
});

// --- 1. ESTACIONES (9 Puntos de Interés con fotos, normas 1FN y especies 3FN asociadas) ---
ecosistemaRouter.get("/estaciones", async (_req, res) => {
  const { rows: stRows } = await pool.query(`
    SELECT *
    FROM v_estacion_completa
    ORDER BY orden ASC, codigo ASC
  `);

  const { rows: photoRows } = await pool.query(`
    SELECT
      ei.id, ei.estacion_id, ei.imagen_id, ei.titulo, ei.descripcion, ei.orden,
      ia.slug AS imagen_slug
    FROM estacion_imagen ei
    JOIN imagen_archivo ia ON ia.id = ei.imagen_id
    ORDER BY ei.orden ASC
  `);

  const { rows: spRows } = await pool.query(`
    SELECT
      ee.estacion_id,
      s.*
    FROM estacion_especie ee
    JOIN v_especie_completa s ON s.id = ee.especie_id
    ORDER BY s.reino_orden ASC, s.nombre_comun ASC
  `);

  const photosByStation = new Map();
  for (const pr of photoRows) {
    const list = photosByStation.get(pr.estacion_id) || [];
    list.push({
      id: pr.id,
      mediaId: pr.imagen_id,
      title: pr.titulo,
      description: pr.descripcion,
      url: mediaUrlFromRow(pr.imagen_id, pr.imagen_slug),
      order: pr.orden,
    });
    photosByStation.set(pr.estacion_id, list);
  }

  const speciesByStation = new Map();
  for (const sr of spRows) {
    const list = speciesByStation.get(sr.estacion_id) || [];
    const illustrationUrl = sr.ilustracion_id
      ? mediaUrlFromRow(sr.ilustracion_id, sr.ilustracion_slug)
      : null;
    const photoUrl = sr.foto_id ? mediaUrlFromRow(sr.foto_id, sr.foto_slug) : null;
    list.push({
      id: sr.id,
      slug: sr.slug,
      commonName: sr.nombre_comun,
      mapudungunName: sr.nombre_mapudungun ?? undefined,
      scientificName: sr.nombre_cientifico,
      kingdom: sr.reino,
      group: sr.grupo,
      category: sr.categoria,
      categoryCode: sr.categoria_codigo,
      conservationStatus: sr.estado_conservacion,
      statusColor: sr.color_estado,
      habitat: sr.habitat,
      description: sr.descripcion,
      funFact: sr.dato_curioso ?? "",
      soundKey: sr.sound_key ?? undefined,
      soundLabel: sr.sound_label ?? undefined,
      image: illustrationUrl || photoUrl || "/api/media/slug/svg-simbolo-angachilla-app",
      illustrationUrl: illustrationUrl ?? undefined,
      photoUrl: photoUrl ?? undefined,
    });
    speciesByStation.set(sr.estacion_id, list);
  }

  const estaciones = stRows.map((r) => {
    const photos = photosByStation.get(r.id) || [];
    const mainImg = r.imagen_principal_id
      ? mediaUrlFromRow(r.imagen_principal_id, r.imagen_principal_slug)
      : photos[0]?.url || "/api/media/slug/estacion-s1-foto-1";

    return {
      id: r.id,
      code: r.codigo,
      slug: r.slug,
      name: r.nombre,
      subtitle: r.subtitulo ?? "",
      category: r.categoria,
      categoryName: r.categoria_nombre,
      description: r.descripcion,
      rules: Array.isArray(r.normas) ? r.normas : [],
      qrCode: r.codigo_qr,
      soundKey: r.sound_key ?? undefined,
      routeId: r.ruta_slug,
      coordinates: [Number(r.lat), Number(r.lng)],
      order: r.orden,
      image: mainImg,
      photos,
      species: speciesByStation.get(r.id) || [],
    };
  });

  res.json({ stations: estaciones });
});

ecosistemaRouter.post("/estaciones", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const b = req.body ?? {};
  const lat = Number(b.coordinates?.[0] ?? b.lat ?? -39.85695);
  const lng = Number(b.coordinates?.[1] ?? b.lng ?? -73.23698);
  const codigo = String(b.code || `E${Date.now().toString().slice(-3)}`).toUpperCase();
  const nombre = String(b.name || "Nueva Estación").trim();
  const slug = String(b.slug || nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  const qrCode = String(b.qrCode || `ANG-QR-${Date.now().toString().slice(-3)}`);

  let imagenPrincipalId = null;
  if (b.image && String(b.image).startsWith("data:image/")) {
    const m = String(b.image).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (m) {
      const saved = await upsertMediaBuffer({
        buffer: Buffer.from(m[2], "base64"),
        mimeType: m[1],
        nombreOriginal: `${slug}.jpg`,
        categoria: "estacion_foto",
      });
      imagenPrincipalId = saved.id;
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO estacion (
      codigo, slug, nombre, subtitulo, categoria_id, descripcion,
      codigo_qr, sound_key, sendero_id, ubicacion, lat, lng, orden, imagen_principal_id
    ) VALUES (
      $1, $2, $3, $4,
      COALESCE((SELECT id FROM categoria_estacion WHERE codigo = $5), (SELECT id FROM categoria_estacion WHERE codigo = 'totem_qr')),
      $6, $7, $8,
      (SELECT id FROM sendero WHERE slug = $9),
      ST_SetSRID(ST_MakePoint($11, $10), 4326), $10, $11, $12, $13
    ) RETURNING id`,
    [
      codigo,
      slug,
      nombre,
      b.subtitle || "",
      b.category || "totem_qr",
      b.description || "",
      qrCode,
      b.soundKey || null,
      b.routeId || "ruta-circuito",
      lat,
      lng,
      Number(b.order ?? 10),
      imagenPrincipalId,
    ]
  );

  const estacionId = rows[0].id;
  if (Array.isArray(b.rules)) {
    for (let i = 0; i < b.rules.length; i++) {
      const texto = String(b.rules[i] || "").trim();
      if (!texto) continue;
      await pool.query(
        "INSERT INTO estacion_norma (estacion_id, orden, texto) VALUES ($1, $2, $3) ON CONFLICT (estacion_id, orden) DO UPDATE SET texto = EXCLUDED.texto",
        [estacionId, i + 1, texto]
      );
    }
  }

  res.status(201).json({ id: estacionId });
});

ecosistemaRouter.put("/estaciones/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const id = String(req.params.id);
  const b = req.body ?? {};
  // Sin coordenadas en el cuerpo se conserva la ubicación actual (antes caía en un punto por defecto)
  const latIn = Number(b.coordinates?.[0] ?? b.lat);
  const lngIn = Number(b.coordinates?.[1] ?? b.lng);
  const hasCoords = Number.isFinite(latIn) && Number.isFinite(lngIn);
  const lat = hasCoords ? latIn : null;
  const lng = hasCoords ? lngIn : null;

  let imagenPrincipalId = null;
  if (b.image && String(b.image).startsWith("data:image/")) {
    const m = String(b.image).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (m) {
      const saved = await upsertMediaBuffer({
        buffer: Buffer.from(m[2], "base64"),
        mimeType: m[1],
        nombreOriginal: `estacion-${id}.jpg`,
        categoria: "estacion_foto",
      });
      imagenPrincipalId = saved.id;
    }
  }

  await pool.query(
    `UPDATE estacion SET
      nombre = COALESCE($2, nombre),
      subtitulo = COALESCE($3, subtitulo),
      categoria_id = COALESCE((SELECT id FROM categoria_estacion WHERE codigo = $4), categoria_id),
      descripcion = COALESCE($5, descripcion),
      codigo_qr = COALESCE($6, codigo_qr),
      sound_key = $7,
      sendero_id = COALESCE((SELECT id FROM sendero WHERE slug = $8), sendero_id),
      ubicacion = CASE WHEN $9::float8 IS NULL THEN ubicacion ELSE ST_SetSRID(ST_MakePoint($10::float8, $9::float8), 4326) END,
      ubicacion_editada = ubicacion_editada OR ($9::float8 IS NOT NULL AND (lat <> $9::float8 OR lng <> $10::float8)),
      lat = COALESCE($9::float8, lat),
      lng = COALESCE($10::float8, lng),
      imagen_principal_id = COALESCE($11, imagen_principal_id)
    WHERE id = $1`,
    [
      id,
      b.name ?? null,
      b.subtitle ?? null,
      b.category ?? null,
      b.description ?? null,
      b.qrCode ?? null,
      b.soundKey ?? null,
      b.routeId ?? null,
      lat,
      lng,
      imagenPrincipalId,
    ]
  );

  if (Array.isArray(b.rules)) {
    await pool.query("DELETE FROM estacion_norma WHERE estacion_id = $1", [id]);
    for (let i = 0; i < b.rules.length; i++) {
      const texto = String(b.rules[i] || "").trim();
      if (!texto) continue;
      await pool.query(
        "INSERT INTO estacion_norma (estacion_id, orden, texto) VALUES ($1, $2, $3)",
        [id, i + 1, texto]
      );
    }
  }

  res.json({ ok: true });
});

ecosistemaRouter.delete("/estaciones/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  await pool.query("DELETE FROM estacion WHERE id = $1", [String(req.params.id)]);
  res.status(204).end();
});

// --- 2. CATÁLOGO DE ESPECIES NORMALIZADO EN 3FN (Fauna, Flora y Reino Fungi) ---
ecosistemaRouter.get("/especies", async (_req, res) => {
  const { rows: spRows } = await pool.query(`
    SELECT *
    FROM v_especie_completa
    ORDER BY reino_orden ASC, nombre_comun ASC
  `);

  const { rows: relRows } = await pool.query(`
    SELECT
      ee.especie_id,
      e.id AS estacion_id,
      e.codigo,
      e.nombre,
      e.lat,
      e.lng,
      COALESCE(se.slug, 'ruta-circuito') AS ruta_slug
    FROM estacion_especie ee
    JOIN estacion e ON e.id = ee.estacion_id
    LEFT JOIN sendero se ON se.id = e.sendero_id
    ORDER BY e.orden ASC
  `);

  const stationsBySpecies = new Map();
  for (const r of relRows) {
    const list = stationsBySpecies.get(r.especie_id) || [];
    list.push({
      id: r.estacion_id,
      code: r.codigo,
      name: r.nombre,
      coordinates: [Number(r.lat), Number(r.lng)],
      routeId: r.ruta_slug,
    });
    stationsBySpecies.set(r.especie_id, list);
  }

  const species = spRows.map((s) => {
    const illustrationUrl = s.ilustracion_id
      ? mediaUrlFromRow(s.ilustracion_id, s.ilustracion_slug)
      : null;
    const photoUrl = s.foto_id ? mediaUrlFromRow(s.foto_id, s.foto_slug) : null;
    const stList = stationsBySpecies.get(s.id) || [];

    return {
      id: s.id,
      slug: s.slug,
      commonName: s.nombre_comun,
      mapudungunName: s.nombre_mapudungun ?? undefined,
      scientificName: s.nombre_cientifico,
      kingdom: s.reino,
      group: s.grupo,
      category: s.categoria,
      categoryCode: s.categoria_codigo,
      conservationStatus: s.estado_conservacion,
      statusColor: s.color_estado,
      habitat: s.habitat,
      description: s.descripcion,
      funFact: s.dato_curioso ?? "",
      soundKey: s.sound_key ?? undefined,
      soundLabel: s.sound_label ?? undefined,
      image: illustrationUrl || photoUrl || "/api/media/slug/svg-simbolo-angachilla-app",
      illustrationUrl: illustrationUrl ?? undefined,
      photoUrl: photoUrl ?? undefined,
      stations: stList,
      approxLocation:
        stList[0]?.coordinates || [Number(s.lat ?? -39.8565), Number(s.lng ?? -73.2385)],
      ebirdUrl: s.ebird_url ?? undefined,
      inaturalistUrl: s.inaturalist_url ?? undefined,
    };
  });

  res.json({ species });
});

ecosistemaRouter.post("/especies", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const b = req.body ?? {};
  const nombreComun = String(b.commonName || "Especie Nativa").trim();
  const slug = `sp-${nombreComun
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;

  let ilustracionId = null;
  if (b.image && String(b.image).startsWith("data:image/")) {
    const m = String(b.image).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (m) {
      const saved = await upsertMediaBuffer({
        buffer: Buffer.from(m[2], "base64"),
        mimeType: m[1],
        nombreOriginal: `${slug}.png`,
        categoria: "especie_ilustracion",
      });
      ilustracionId = saved.id;
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO especie (
      slug, nombre_comun, nombre_mapudungun, nombre_cientifico,
      categoria_id, estado_conservacion_id,
      habitat, descripcion, dato_curioso, sound_key, sound_label, ilustracion_id
    ) VALUES (
      $1, $2, $3, $4,
      COALESCE((SELECT id FROM categoria_especie WHERE codigo = $5), (SELECT id FROM categoria_especie WHERE codigo = 'ave_acuatica')),
      COALESCE((SELECT id FROM estado_conservacion WHERE nombre = $6), (SELECT id FROM estado_conservacion WHERE codigo = 'preocupacion_menor')),
      $7, $8, $9, $10, $11, $12
    )
    RETURNING id`,
    [
      slug,
      nombreComun,
      b.mapudungunName || null,
      b.scientificName || nombreComun,
      b.category || "ave_acuatica",
      b.conservationStatus || "Preocupación Menor",
      b.habitat || "Reserva Comunitaria Bosque Humedal Angachilla",
      b.description || "",
      b.funFact || "",
      b.soundKey || null,
      b.soundLabel || null,
      ilustracionId,
    ]
  );

  res.status(201).json({ id: rows[0].id });
});

ecosistemaRouter.put("/especies/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const id = String(req.params.id);
  const b = req.body ?? {};

  let ilustracionId = null;
  if (b.image && String(b.image).startsWith("data:image/")) {
    const m = String(b.image).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (m) {
      const saved = await upsertMediaBuffer({
        buffer: Buffer.from(m[2], "base64"),
        mimeType: m[1],
        nombreOriginal: `sp-${id}.png`,
        categoria: "especie_ilustracion",
      });
      ilustracionId = saved.id;
    }
  }

  await pool.query(
    `UPDATE especie SET
      nombre_comun = COALESCE($2, nombre_comun),
      nombre_mapudungun = $3,
      nombre_cientifico = COALESCE($4, nombre_cientifico),
      categoria_id = COALESCE((SELECT id FROM categoria_especie WHERE codigo = $5), categoria_id),
      estado_conservacion_id = COALESCE((SELECT id FROM estado_conservacion WHERE nombre = $6), estado_conservacion_id),
      habitat = COALESCE($7, habitat),
      descripcion = COALESCE($8, descripcion),
      dato_curioso = COALESCE($9, dato_curioso),
      sound_key = $10,
      ilustracion_id = COALESCE($11, ilustracion_id)
    WHERE id = $1`,
    [
      id,
      b.commonName ?? null,
      b.mapudungunName ?? null,
      b.scientificName ?? null,
      b.category ?? null,
      b.conservationStatus ?? null,
      b.habitat ?? null,
      b.description ?? null,
      b.funFact ?? null,
      b.soundKey ?? null,
      ilustracionId,
    ]
  );

  res.json({ ok: true });
});

ecosistemaRouter.delete("/especies/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  await pool.query("DELETE FROM especie WHERE id = $1", [String(req.params.id)]);
  res.status(204).end();
});

// --- 3. SENDEROS GPX REALES ---
ecosistemaRouter.get("/senderos", async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT
      id, slug, nombre, dificultad, minutos_estimados, distancia_km,
      es_circuito, color, descripcion, autor_gpx, url_fuente, fecha_grabacion,
      puntos_json, bounds_json, checkpoints_json
    FROM sendero
    ORDER BY slug ASC
  `);

  const routes = rows.map((r) => ({
    id: r.slug,
    dbId: r.id,
    name: r.nombre,
    difficulty: r.dificultad,
    estimatedMinutes: r.minutos_estimados,
    distanceKm: Number(r.distancia_km),
    isLoop: r.es_circuito,
    color: r.color,
    description: r.descripcion,
    path: Array.isArray(r.puntos_json) ? r.puntos_json : [],
    bounds: Array.isArray(r.bounds_json)
      ? r.bounds_json
      : [
          [-39.8593, -73.241],
          [-39.8549, -73.2365],
        ],
    checkpoints: Array.isArray(r.checkpoints_json) ? r.checkpoints_json : [],
    source: {
      author: r.autor_gpx ?? "Gonzalo Gallardo",
      url: r.url_fuente ?? undefined,
      recordedAt: r.fecha_grabacion ?? undefined,
    },
  }));

  res.json({ routes });
});

// --- 4. GALERÍA OFICIAL DE LA RESERVA ---
ecosistemaRouter.get("/galeria-oficial", async (req, res) => {
  const estacionCodigo = req.query.estacion ? String(req.query.estacion) : null;
  const params = [];
  let where = "";
  if (estacionCodigo && estacionCodigo !== "todas") {
    params.push(estacionCodigo);
    where = "WHERE e.codigo = $1";
  }

  const { rows } = await pool.query(
    `SELECT
      ei.id, ei.titulo, ei.descripcion, ei.orden, ei.creado_en,
      ei.imagen_id, ia.slug AS imagen_slug,
      e.id AS estacion_id, e.codigo AS estacion_codigo, e.nombre AS estacion_nombre,
      e.subtitulo AS estacion_subtitulo, e.lat, e.lng,
      COALESCE(se.slug, 'ruta-circuito') AS ruta_slug
    FROM estacion_imagen ei
    JOIN estacion e ON e.id = ei.estacion_id
    LEFT JOIN sendero se ON se.id = e.sendero_id
    JOIN imagen_archivo ia ON ia.id = ei.imagen_id
    ${where}
    ORDER BY e.orden ASC, ei.orden ASC`,
    params
  );

  res.json({
    photos: rows.map((r) => ({
      id: r.id,
      title: r.titulo,
      description: r.descripcion || r.estacion_subtitulo || "",
      imageUrl: mediaUrlFromRow(r.imagen_id, r.imagen_slug),
      stationId: r.estacion_id,
      stationCode: r.estacion_codigo,
      stationName: r.estacion_nombre,
      coordinates: [Number(r.lat), Number(r.lng)],
      routeId: r.ruta_slug,
      createdAt: r.creado_en.toISOString().slice(0, 10),
    })),
  });
});

ecosistemaRouter.post("/galeria-oficial", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const b = req.body ?? {};
  const stationCode = String(b.stationCode || "S1");
  const title = String(b.title || "Fotografía Oficial Reserva Angachilla").trim();
  const description = String(b.description || "").trim();
  const dataUrl = String(b.dataUrl || b.imageUrl || "");

  const stRes = await pool.query("SELECT id FROM estacion WHERE codigo = $1", [stationCode]);
  const estacionId = stRes.rows[0]?.id;
  if (!estacionId) {
    return res.status(400).json({ error: "Estación no encontrada" });
  }

  const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) {
    return res.status(400).json({ error: "Debes subir un archivo de imagen válido" });
  }

  const savedMedia = await upsertMediaBuffer({
    buffer: Buffer.from(m[2], "base64"),
    mimeType: m[1],
    nombreOriginal: `${stationCode}-${Date.now()}.jpg`,
    categoria: "estacion_foto",
    subidoPor: req.userId,
  });

  const { rows } = await pool.query(
    `INSERT INTO estacion_imagen (estacion_id, imagen_id, titulo, descripcion, orden)
     VALUES ($1, $2, $3, $4, 99)
     RETURNING id`,
    [estacionId, savedMedia.id, title, description]
  );

  res.status(201).json({ id: rows[0].id, imageUrl: `/api/media/${savedMedia.id}` });
});

ecosistemaRouter.delete("/galeria-oficial/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  await pool.query("DELETE FROM estacion_imagen WHERE id = $1", [String(req.params.id)]);
  res.status(204).end();
});

// --- 5. CONTENIDOS INSTITUCIONALES ---
ecosistemaRouter.get("/contenidos", async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT slug, titulo, subtitulo, cuerpo_json, actualizado_en FROM contenido_institucional"
  );
  const map = {};
  for (const r of rows) {
    map[r.slug] = r.cuerpo_json;
  }
  res.json({ contents: map });
});

// --- 6. AVISOS OFICIALES Y BARRA ROTATIVA (Normalizado con categoria_aviso) ---
ecosistemaRouter.get("/avisos", async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT
      a.id, a.titulo, a.resumen, a.contenido,
      ca.codigo AS categoria, ca.nombre AS categoria_nombre,
      a.autor, a.fijado, a.activo_en_banner, a.creado_en,
      a.imagen_id, ia.slug AS imagen_slug
    FROM aviso_oficial a
    JOIN categoria_aviso ca ON ca.id = a.categoria_id
    LEFT JOIN imagen_archivo ia ON ia.id = a.imagen_id
    ORDER BY a.fijado DESC, a.creado_en DESC
  `);

  res.json({
    notices: rows.map((r) => ({
      id: r.id,
      title: r.titulo,
      summary: r.resumen,
      fullText: r.contenido,
      category: r.categoria,
      categoryName: r.categoria_nombre,
      author: r.autor,
      pinned: r.fijado,
      activeInBanner: r.activo_en_banner,
      approved: true,
      date: r.creado_en.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      image: mediaUrlFromRow(r.imagen_id, r.imagen_slug),
    })),
  });
});

ecosistemaRouter.post("/avisos", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const b = req.body ?? {};
  const titulo = String(b.title || "").trim();
  const resumen = String(b.summary || "").trim();
  const contenido = String(b.fullText || resumen).trim();
  if (!titulo || !resumen) {
    return res.status(400).json({ error: "Título y resumen son obligatorios" });
  }

  let imagenId = null;
  if (b.image && String(b.image).startsWith("data:image/")) {
    const m = String(b.image).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (m) {
      const saved = await upsertMediaBuffer({
        buffer: Buffer.from(m[2], "base64"),
        mimeType: m[1],
        nombreOriginal: `aviso-${Date.now()}.jpg`,
        categoria: "institucional",
        subidoPor: req.userId,
      });
      imagenId = saved.id;
    }
  } else {
    const def = await pool.query(
      "SELECT id FROM imagen_archivo WHERE slug = 'estacion-s3-foto-1'"
    );
    imagenId = def.rows[0]?.id ?? null;
  }

  const { rows } = await pool.query(
    `INSERT INTO aviso_oficial (titulo, resumen, contenido, categoria_id, autor, imagen_id, fijado, activo_en_banner)
     VALUES (
       $1, $2, $3,
       COALESCE((SELECT id FROM categoria_aviso WHERE codigo = $4), (SELECT id FROM categoria_aviso WHERE codigo = 'oficial')),
       $5, $6, $7, true
     )
     RETURNING id`,
    [
      titulo,
      resumen,
      contenido,
      b.category || "oficial",
      b.author || "Comité Ecológico Humedal Angachilla",
      imagenId,
      Boolean(b.pinned),
    ]
  );

  res.status(201).json({ id: rows[0].id });
});

ecosistemaRouter.delete("/avisos/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  await pool.query("DELETE FROM aviso_oficial WHERE id = $1", [String(req.params.id)]);
  res.status(204).end();
});

// --- 7. CALENDARIO DE ACTIVIDADES Y EVENTOS (Normalizado con categoria_evento y sendero_id) ---
ecosistemaRouter.get("/eventos", async (req, res) => {
  const userId = req.userId ?? null;
  const { rows } = await pool.query(
    `SELECT
      ev.id, ev.titulo, ev.descripcion, ev.fecha::text AS fecha_str, ev.horario,
      ev.lugar_nombre, ev.lat, ev.lng,
      ce.codigo AS categoria, ce.nombre AS categoria_nombre,
      COALESCE(se.slug, 'ruta-circuito') AS ruta_slug,
      COALESCE(se.nombre, 'Circuito Angachilla') AS ruta_nombre,
      COALESCE(est.codigo, 'S3') AS estacion_codigo,
      ev.cupos, COALESCE(ev.inscritos_base, 0) AS inscritos_base, ev.organizador,
      ev.imagen_id, ia.slug AS imagen_slug,
      COUNT(ie.usuario_id)::int AS inscritos,
      BOOL_OR(ie.usuario_id = $1) AS inscrito_por_mi
    FROM evento ev
    JOIN categoria_evento ce ON ce.id = ev.categoria_id
    LEFT JOIN sendero se ON se.id = ev.sendero_id
    LEFT JOIN estacion est ON est.id = ev.estacion_id
    LEFT JOIN imagen_archivo ia ON ia.id = ev.imagen_id
    LEFT JOIN inscripcion_evento ie ON ie.evento_id = ev.id
    GROUP BY ev.id, ce.codigo, ce.nombre, se.slug, se.nombre, est.codigo, ia.slug
    ORDER BY ev.fecha ASC, ev.horario ASC`,
    [userId]
  );

  res.json({
    events: rows.map((r) => ({
      id: r.id,
      title: r.titulo,
      description: r.descripcion,
      date: r.fecha_str,
      time: r.horario,
      locationName: r.lugar_nombre,
      stationCode: r.estacion_codigo,
      routeId: r.ruta_slug,
      routeName: r.ruta_nombre,
      coordinates: [Number(r.lat), Number(r.lng)],
      category: r.categoria,
      categoryName: r.categoria_nombre,
      capacity: r.cupos,
      registeredCount: Math.min(r.cupos, Number(r.inscritos_base || 0) + Number(r.inscritos || 0)),
      isRegistered: Boolean(r.inscrito_por_mi),
      organizer: r.organizador,
      image: mediaUrlFromRow(r.imagen_id, r.imagen_slug),
    })),
  });
});

ecosistemaRouter.post("/eventos/:id/inscribir", async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Inicia sesión para inscribirte en las actividades" });
  }
  const eventoId = String(req.params.id);

  const existing = await pool.query(
    "SELECT 1 FROM inscripcion_evento WHERE evento_id = $1 AND usuario_id = $2",
    [eventoId, req.userId]
  );

  let isRegistered = false;
  if (existing.rowCount > 0) {
    await pool.query(
      "DELETE FROM inscripcion_evento WHERE evento_id = $1 AND usuario_id = $2",
      [eventoId, req.userId]
    );
    isRegistered = false;
  } else {
    await pool.query(
      "INSERT INTO inscripcion_evento (evento_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [eventoId, req.userId]
    );
    isRegistered = true;
  }

  const countRes = await pool.query(
    `SELECT
       ev.cupos,
       COALESCE(ev.inscritos_base, 0) + COUNT(ie.usuario_id)::int AS total_inscritos
     FROM evento ev
     LEFT JOIN inscripcion_evento ie ON ie.evento_id = ev.id
     WHERE ev.id = $1
     GROUP BY ev.id`,
    [eventoId]
  );

  const row = countRes.rows[0];
  res.json({
    isRegistered,
    registeredCount: row ? Math.min(row.cupos, row.total_inscritos) : 0,
  });
});

ecosistemaRouter.post("/eventos", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const b = req.body ?? {};
  const lat = Number(b.coordinates?.[0] ?? b.lat ?? -39.85675);
  const lng = Number(b.coordinates?.[1] ?? b.lng ?? -73.23785);

  let imagenId = null;
  if (b.image && String(b.image).startsWith("data:image/")) {
    const m = String(b.image).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (m) {
      const saved = await upsertMediaBuffer({
        buffer: Buffer.from(m[2], "base64"),
        mimeType: m[1],
        nombreOriginal: `evento-${Date.now()}.jpg`,
        categoria: "institucional",
        subidoPor: req.userId,
      });
      imagenId = saved.id;
    }
  } else {
    const def = await pool.query(
      "SELECT id FROM imagen_archivo WHERE slug = 'estacion-s3-foto-1'"
    );
    imagenId = def.rows[0]?.id ?? null;
  }

  const { rows } = await pool.query(
    `INSERT INTO evento (
      titulo, descripcion, fecha, horario, lugar_nombre,
      sendero_id, lat, lng, categoria_id, cupos, organizador, imagen_id
    ) VALUES (
      $1, $2, $3, $4, $5,
      COALESCE((SELECT id FROM sendero WHERE slug = $6), (SELECT id FROM sendero WHERE slug = 'ruta-circuito')),
      $7, $8,
      COALESCE((SELECT id FROM categoria_evento WHERE codigo = $9), (SELECT id FROM categoria_evento WHERE codigo = 'educativo')),
      $10, $11, $12
    )
    RETURNING id`,
    [
      b.title || "Actividad en Reserva Angachilla",
      b.description || "",
      b.date || new Date().toISOString().slice(0, 10),
      b.time || "10:00 - 12:00 hrs",
      b.locationName || "Placita de la Resistencia",
      b.routeId || "ruta-circuito",
      lat,
      lng,
      b.category || "educativo",
      Number(b.capacity ?? 20),
      b.organizer || "Comité Ecológico Humedal Angachilla",
      imagenId,
    ]
  );

  res.status(201).json({ id: rows[0].id });
});

ecosistemaRouter.put("/eventos/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const id = String(req.params.id);
  const b = req.body ?? {};
  const lat = Number(b.coordinates?.[0] ?? b.lat ?? -39.85675);
  const lng = Number(b.coordinates?.[1] ?? b.lng ?? -73.23785);

  await pool.query(
    `UPDATE evento SET
      titulo = COALESCE($2, titulo),
      descripcion = COALESCE($3, descripcion),
      fecha = COALESCE($4::date, fecha),
      horario = COALESCE($5, horario),
      lugar_nombre = COALESCE($6, lugar_nombre),
      sendero_id = COALESCE((SELECT id FROM sendero WHERE slug = $7), sendero_id),
      lat = $8,
      lng = $9,
      categoria_id = COALESCE((SELECT id FROM categoria_evento WHERE codigo = $10), categoria_id),
      cupos = COALESCE($11, cupos),
      organizador = COALESCE($12, organizador)
    WHERE id = $1`,
    [
      id,
      b.title ?? null,
      b.description ?? null,
      b.date ?? null,
      b.time ?? null,
      b.locationName ?? null,
      b.routeId ?? null,
      lat,
      lng,
      b.category ?? null,
      b.capacity ? Number(b.capacity) : null,
      b.organizer ?? null,
    ]
  );
  res.json({ ok: true });
});

ecosistemaRouter.delete("/eventos/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  await pool.query("DELETE FROM evento WHERE id = $1", [String(req.params.id)]);
  res.status(204).end();
});

// --- 8. SUGERENCIAS, DONACIONES Y CONTACTO (Normalizados en 3FN) ---
ecosistemaRouter.get("/sugerencias", async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT
      s.id, s.titulo, s.descripcion,
      cs.codigo AS categoria, cs.nombre AS categoria_nombre,
      es.codigo AS estado, es.nombre AS estado_nombre,
      s.autor_nombre, s.autor_email, s.comentario_admin, s.creado_en
    FROM sugerencia s
    JOIN categoria_sugerencia cs ON cs.id = s.categoria_id
    JOIN estado_sugerencia es ON es.id = s.estado_id
    ORDER BY s.creado_en DESC
  `);
  res.json({
    suggestions: rows.map((r) => ({
      id: r.id,
      title: r.titulo,
      description: r.descripcion,
      category: r.categoria,
      categoryName: r.categoria_nombre,
      status: r.estado,
      statusName: r.estado_nombre,
      authorName: r.autor_nombre,
      authorEmail: r.autor_email,
      adminComment: r.comentario_admin ?? undefined,
      createdAt: r.creado_en.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    })),
  });
});

ecosistemaRouter.post("/sugerencias", async (req, res) => {
  const b = req.body ?? {};
  const titulo = String(b.title || "").trim();
  const descripcion = String(b.description || "").trim();
  if (!titulo || !descripcion) {
    return res.status(400).json({ error: "Título y descripción son obligatorios" });
  }
  const categoriaCodigo = String(b.category || "infraestructura");
  const { rows } = await pool.query(
    `INSERT INTO sugerencia (titulo, descripcion, categoria_id, estado_id, autor_nombre, autor_email, usuario_id)
     VALUES (
       $1, $2,
       COALESCE((SELECT id FROM categoria_sugerencia WHERE codigo = $3), (SELECT id FROM categoria_sugerencia WHERE codigo = 'infraestructura')),
       (SELECT id FROM estado_sugerencia WHERE codigo = 'pendiente'),
       $4, $5, $6
     )
     RETURNING id, titulo, descripcion, autor_nombre, autor_email, creado_en`,
    [
      titulo,
      descripcion,
      categoriaCodigo,
      b.authorName || "Visitante",
      b.authorEmail || "visitante@angachilla.cl",
      req.userId || null,
    ]
  );
  const r = rows[0];
  res.status(201).json({
    suggestion: {
      id: r.id,
      title: r.titulo,
      description: r.descripcion,
      category: categoriaCodigo,
      status: "pendiente",
      authorName: r.autor_nombre,
      authorEmail: r.autor_email,
      createdAt: r.creado_en.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    },
  });
});

ecosistemaRouter.patch("/sugerencias/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const id = String(req.params.id);
  const { status, adminComment } = req.body ?? {};
  await pool.query(
    `UPDATE sugerencia
     SET
       estado_id = COALESCE((SELECT id FROM estado_sugerencia WHERE codigo = $2), estado_id),
       comentario_admin = $3
     WHERE id = $1`,
    [id, status || "aprobada", adminComment || null]
  );
  res.json({ ok: true });
});

ecosistemaRouter.delete("/sugerencias/:id", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  await pool.query("DELETE FROM sugerencia WHERE id = $1", [String(req.params.id)]);
  res.status(204).end();
});

ecosistemaRouter.get("/donaciones", async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT
      d.id, d.numero_recibo, d.donante_nombre, d.donante_email, d.monto_clp,
      pd.codigo AS proposito, pd.nombre AS proposito_nombre,
      mp.codigo AS medio_pago, mp.nombre AS medio_pago_nombre,
      d.creado_en
    FROM donacion d
    JOIN proposito_donacion pd ON pd.id = d.proposito_id
    JOIN medio_pago mp ON mp.id = d.medio_pago_id
    ORDER BY d.creado_en DESC
  `);
  res.json({
    donations: rows.map((r) => ({
      id: r.id,
      receiptNumber: r.numero_recibo,
      donorName: r.donante_nombre,
      donorEmail: r.donante_email,
      amountClp: r.monto_clp,
      purpose: r.proposito,
      purposeName: r.proposito_nombre,
      paymentMethod: r.medio_pago,
      paymentMethodName: r.medio_pago_nombre,
      date: r.creado_en.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    })),
  });
});

ecosistemaRouter.post("/donaciones", async (req, res) => {
  const b = req.body ?? {};
  const monto = Number(b.amountClp ?? 0);
  if (!monto || monto < 500) {
    return res.status(400).json({ error: "El monto mínimo de donación es $500 CLP" });
  }
  const receiptNumber = `ANG-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const propositoCodigo = String(b.purpose || "general");
  const medioPagoCodigo = String(b.paymentMethod || "transferencia");

  const { rows } = await pool.query(
    `INSERT INTO donacion (
       numero_recibo, donante_nombre, donante_email, usuario_id, monto_clp, proposito_id, medio_pago_id
     )
     VALUES (
       $1, $2, $3, $4, $5,
       COALESCE((SELECT id FROM proposito_donacion WHERE codigo = $6), (SELECT id FROM proposito_donacion WHERE codigo = 'general')),
       COALESCE((SELECT id FROM medio_pago WHERE codigo = $7), (SELECT id FROM medio_pago WHERE codigo = 'transferencia'))
     )
     RETURNING id, numero_recibo, donante_nombre, donante_email, monto_clp, creado_en`,
    [
      receiptNumber,
      String(b.donorName || "Aportante Anónimo").trim(),
      String(b.donorEmail || "aporte@angachilla.cl").trim(),
      req.userId || null,
      monto,
      propositoCodigo,
      medioPagoCodigo,
    ]
  );
  const r = rows[0];
  res.status(201).json({
    donation: {
      id: r.id,
      receiptNumber: r.numero_recibo,
      donorName: r.donante_nombre,
      donorEmail: r.donante_email,
      amountClp: r.monto_clp,
      purpose: propositoCodigo,
      paymentMethod: medioPagoCodigo,
      date: r.creado_en.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    },
  });
});

ecosistemaRouter.get("/contacto", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { rows } = await pool.query("SELECT * FROM consulta_contacto ORDER BY creado_en DESC");
  res.json({ inquiries: rows });
});

ecosistemaRouter.post("/contacto", async (req, res) => {
  const b = req.body ?? {};
  const nombre = String(b.name || "").trim();
  const email = String(b.email || "").trim();
  const asunto = String(b.subject || "Consulta sobre Reserva Comunitaria").trim();
  const mensaje = String(b.message || "").trim();
  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ error: "Nombre, correo y mensaje son obligatorios" });
  }
  const { rows } = await pool.query(
    `INSERT INTO consulta_contacto (nombre, email, asunto, mensaje)
     VALUES ($1, $2, $3, $4)
     RETURNING id, creado_en`,
    [nombre, email, asunto, mensaje]
  );
  res.status(201).json({ id: rows[0].id, createdAt: rows[0].creado_en });
});
