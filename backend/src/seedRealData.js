import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pool } from "./db.js";
import { upsertMediaBuffer } from "./routes/media.js";
import {
  STATIONS_DATA,
  SPECIES_METADATA,
  EXTRA_SPECIES_LIST,
  INSTITUTIONAL_CONTENT,
} from "./seedDataCatalog.js";
import { feedPostsCol, commentsCol, routeAlertsCol } from "./mongo.js";

const UTILIDAD_DIR = process.env.UTILIDAD_DIR || path.resolve(process.cwd(), "../utilidad");
const POINTS_ROUTE_DIR = process.env.POINTS_ROUTE_DIR || path.resolve(process.cwd(), "./Points_Route");
const ESPECIES_EXTRA_DIR =
  process.env.ESPECIES_EXTRA_DIR || path.resolve(process.cwd(), "../frontend/web/public/especies");

function slugify(str) {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Limpia elementos ocultos (display:none) en SVGs exportados de Inkscape
function optimizeInkscapeSvg(svgText) {
  let cleaned = svgText.replace(/<image\b[^>]*style="[^"]*display\s*:\s*none[^"]*"[^>]*\/>/gi, "");
  cleaned = cleaned.replace(/<g\b[^>]*style="[^"]*display\s*:\s*none[^"]*"[^>]*>(?:(?!<g\b)[\s\S])*?<\/g>/gi, "");
  return cleaned;
}

function parseGpxTrack(xml) {
  const pts = [];
  const trkptRe = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;
  let m;
  while ((m = trkptRe.exec(xml)) !== null) {
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      pts.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
    }
  }
  return pts;
}

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export async function seedRealData() {
  if (!existsSync(UTILIDAD_DIR)) {
    console.warn(`No se encontró carpeta utilidad en ${UTILIDAD_DIR}; omitiendo seed de archivos.`);
    return;
  }

  console.log("Verificando e ingresando activos reales en PostgreSQL (3FN) + MongoDB...");

  // 1. Ingestar las 2 rutas GPX reales en la tabla sendero (primero para asociar FK sendero_id en estacion y evento)
  const gpxRoutes = [
    {
      slug: "ruta-circuito",
      file: "angachilla-circuito.gpx",
      fallbackFile: "10-oct-2025-1718.gpx",
      nombre: "Circuito Angachilla",
      dificultad: "Fácil",
      minutosEstimados: 66,
      esCircuito: true,
      color: "#047857",
      descripcion:
        "Circuito principal que parte desde la Placita de la Resistencia, recorre el Mirador del Hualve (S1), Laguna de los Pinos (S2), Mirador Espejo del Angachilla (S3), Totoral del Santuario (S4) y retorna por la Vega de la Garza (S6).",
      autorGpx: "Gonzalo Gallardo",
      urlFuente: "https://es.wikiloc.com/rutas-senderismo/angachilla-circuito-258747871",
      fechaGrabacion: "2026-04-12",
      checkpoints: [
        {
          id: "cp-circuito-1",
          name: "Placita de la Resistencia y Mirador del Hualve (S1)",
          instruction: "Inicia el recorrido desde el acceso principal hacia el Mirador del Hualve.",
          progress: 0.1,
          alertType: "info",
          alertMessage: "Recuerda transitar en silencio y mantener a tus mascotas con correa.",
        },
        {
          id: "cp-circuito-2",
          name: "Laguna de los Pinos (S2) y Espejo del Angachilla (S3)",
          instruction: "Avanza hacia el poniente bordeando la laguna de anfibios hasta el Mirador Espejo del Angachilla.",
          progress: 0.45,
          alertType: "viewpoint",
          alertMessage: "Zona de avistamiento de cisnes de cuello negro, garzas cucas y coipos.",
        },
        {
          id: "cp-circuito-3",
          name: "Totoral del Santuario (S4) y Vega de la Garza (S6)",
          instruction: "Emprende el retorno bordeando el totoral y la planicie de la Vega de la Garza hasta el acceso.",
          progress: 0.85,
          alertType: "info",
          alertMessage: "No ingreses a las áreas de nidificación del pajonal.",
        },
      ],
    },
    {
      slug: "ruta-canelos",
      file: "angachilla-bosque-los-canelo-circuito.gpx",
      fallbackFile: "31-ago-2021-952.gpx",
      nombre: "Bosque Los Canelos",
      dificultad: "Fácil",
      minutosEstimados: 27,
      esCircuito: true,
      color: "#0e7490",
      descripcion:
        "Recorrido interpretativo hacia el sector sur del humedal, atravesando el Auditorio Vivo, el bosque inundable de canelos, arrayanes, temus y pitras (Estación 5) y el Espacio de Reflexión.",
      autorGpx: "Gonzalo Gallardo",
      urlFuente: "https://es.wikiloc.com/rutas-senderismo/angachilla-bosque-los-canelo-circuito-258747908",
      fechaGrabacion: "2026-04-12",
      checkpoints: [
        {
          id: "cp-canelos-1",
          name: "Acceso hacia Auditorio Vivo",
          instruction: "Toma el sendero sur desde el acceso en dirección al Auditorio Vivo.",
          progress: 0.15,
          alertType: "info",
          alertMessage: "Respeta la flora nativa y la funga del bosque húmedo.",
        },
        {
          id: "cp-canelos-2",
          name: "Estación 5: Bosque Los Canelos",
          instruction: "Te adentras en el bosque inundable de canelos, temus y pitras.",
          progress: 0.5,
          alertType: "caution",
          alertMessage: "Observa en el suelo las chimeneas del camarón de vega sin alterarlas.",
        },
        {
          id: "cp-canelos-3",
          name: "Espacio de Reflexión y retorno",
          instruction: "Llega al Espacio de Reflexión en el extremo sur y emprende el regreso hacia el acceso.",
          progress: 0.9,
          alertType: "info",
        },
      ],
    },
  ];

  for (const r of gpxRoutes) {
    let gpxPath = path.join(POINTS_ROUTE_DIR, r.file);
    if (!existsSync(gpxPath) && r.fallbackFile) {
      gpxPath = path.join(POINTS_ROUTE_DIR, r.fallbackFile);
    }
    if (!existsSync(gpxPath)) continue;
    const xml = await readFile(gpxPath, "utf8");
    const points = parseGpxTrack(xml);
    if (points.length < 2) continue;

    let distKm = 0;
    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;
    for (let i = 0; i < points.length; i++) {
      const [lat, lng] = points[i];
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (i > 0) distKm += haversineKm(points[i - 1], points[i]);
    }

    const wktCoords = points.map(([lat, lng]) => `${lng} ${lat}`).join(", ");
    const wkt = `LINESTRING(${wktCoords})`;
    const bounds = [
      [minLat, minLng],
      [maxLat, maxLng],
    ];

    await pool.query(
      `INSERT INTO sendero (
        slug, nombre, dificultad, minutos_estimados, distancia_km, es_circuito,
        color, descripcion, autor_gpx, url_fuente, fecha_grabacion,
        puntos_json, bounds_json, checkpoints_json, trazado
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12::jsonb, $13::jsonb, $14::jsonb, ST_GeomFromText($15, 4326)
      )
      ON CONFLICT (slug) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        dificultad = EXCLUDED.dificultad,
        minutos_estimados = EXCLUDED.minutos_estimados,
        distancia_km = EXCLUDED.distancia_km,
        es_circuito = EXCLUDED.es_circuito,
        color = EXCLUDED.color,
        descripcion = EXCLUDED.descripcion,
        autor_gpx = EXCLUDED.autor_gpx,
        url_fuente = EXCLUDED.url_fuente,
        fecha_grabacion = EXCLUDED.fecha_grabacion,
        puntos_json = EXCLUDED.puntos_json,
        bounds_json = EXCLUDED.bounds_json,
        checkpoints_json = EXCLUDED.checkpoints_json,
        trazado = EXCLUDED.trazado`,
      [
        r.slug,
        r.nombre,
        r.dificultad,
        r.minutosEstimados,
        Number(distKm.toFixed(2)),
        r.esCircuito,
        r.color,
        r.descripcion,
        r.autorGpx,
        r.urlFuente,
        r.fechaGrabacion,
        JSON.stringify(points),
        JSON.stringify(bounds),
        JSON.stringify(r.checkpoints),
        wkt,
      ]
    );
  }

  // 2. Ingestar los 11 SVGs oficiales
  const svgSlugMap = {
    "DISEÑO BARRA SUPERIOR.svg": "svg-diseno-barra-superior",
    "ICONO FONDO BLANCO.svg": "svg-icono-fondo-blanco",
    "ICONO FONDO GRIS.svg": "svg-icono-fondo-gris",
    "LETRAS ANGACHILLA APP.svg": "svg-letras-angachilla-app",
    "LETRAS BOSQUE HUMEDAL ANGACHILLA.svg": "svg-letras-bosque-humedal",
    "LOGO COMITE ECOLÓGICO.svg": "svg-logo-comite-ecologico",
    "LOGO DE BOTON DE MAPA.svg": "svg-logo-boton-mapa",
    "LOGO MARCA TURISTICA.svg": "svg-logo-marca-turistica",
    "LOGO MUNI VALDIVIA.svg": "svg-logo-muni-valdivia",
    "LOGO RESERVA CON LETRAS BOSQUE HUMEDAL.svg": "svg-logo-reserva-comunitaria",
    "SIMBOLO ANGACHILLA APP.svg": "svg-simbolo-angachilla-app",
  };

  let svgDir = path.join(UTILIDAD_DIR, "LOGOS Y LETRAS APP");
  if (!existsSync(svgDir)) svgDir = path.join(UTILIDAD_DIR, "GRÁFICAS SVG");
  if (existsSync(svgDir)) {
    const svgFiles = await readdir(svgDir);
    for (const file of svgFiles) {
      if (!file.endsWith(".svg")) continue;
      const rawSvg = await readFile(path.join(svgDir, file), "utf8");
      const optimized = optimizeInkscapeSvg(rawSvg);
      const slug = svgSlugMap[file] || `svg-${slugify(file.replace(/\.svg$/i, ""))}`;
      await upsertMediaBuffer({
        buffer: Buffer.from(optimized, "utf8"),
        mimeType: "image/svg+xml",
        nombreOriginal: file,
        categoria: "svg_oficial",
        slug,
      });
    }
  }

  // 3. Ingestar las 10 Texturas Vivas (preferir versiones optimizadas si existen)
  let texDir = path.join(UTILIDAD_DIR, "OPTIMIZED_MEDIA", "texturas");
  if (!existsSync(texDir)) texDir = path.join(UTILIDAD_DIR, "TEXTURAS");
  if (!existsSync(texDir)) texDir = path.join(UTILIDAD_DIR, "FONDOS TEXTURAS VIVAS");
  if (existsSync(texDir)) {
    const texFiles = (await readdir(texDir)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
    for (let i = 0; i < texFiles.length; i++) {
      const file = texFiles[i];
      const buffer = await readFile(path.join(texDir, file));
      await upsertMediaBuffer({
        buffer,
        mimeType: "image/jpeg",
        nombreOriginal: file,
        categoria: "textura_viva",
        slug: `tex-${i + 1}`,
      });
    }
  }

  // 4. Ingestar imágenes extraídas de los DOCX
  const docxMediaDir = path.join(UTILIDAD_DIR, "DOCX_MEDIA");
  if (existsSync(docxMediaDir)) {
    const docxFiles = (await readdir(docxMediaDir)).sort();
    for (const file of docxFiles) {
      const buffer = await readFile(path.join(docxMediaDir, file));
      const ext = path.extname(file).toLowerCase();
      const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
      const base = file.replace(/\.(png|jpe?g)$/i, "");
      const slug = `docx-${base.replace("_image", "-")}`;
      await upsertMediaBuffer({
        buffer,
        mimeType,
        nombreOriginal: file,
        categoria: "institucional",
        slug,
      });
    }
  }

  // 5. Limpiar fotos externas antiguas (extra-sp-*) y especies no presentes en utilidad/PUNTOS DE ESTACIONES/
  await pool.query(
    `DELETE FROM especie WHERE slug IN ('sp-chucao', 'sp-ranita-darwin', 'sp-diguene', 'sp-changle', 'sp-cortinario-morado', 'sp-oreja-palo')`
  );
  await pool.query(
    `UPDATE especie SET foto_id = NULL WHERE foto_id IN (SELECT id FROM imagen_archivo WHERE slug LIKE 'extra-sp-%')`
  );
  await pool.query(
    `UPDATE especie SET ilustracion_id = NULL WHERE ilustracion_id IN (SELECT id FROM imagen_archivo WHERE slug LIKE 'extra-sp-%')`
  );
  await pool.query(`DELETE FROM imagen_archivo WHERE slug LIKE 'extra-sp-%'`);

  // 6. Ingestar las 9 Estaciones (normalizadas con categoria_id, sendero_id y estacion_norma) y sus 50 especies ilustradas
  let stationsBaseDir = path.join(UTILIDAD_DIR, "OPTIMIZED_MEDIA", "estaciones");
  if (!existsSync(stationsBaseDir)) stationsBaseDir = path.join(UTILIDAD_DIR, "FOTOS POR ESTACION");
  if (!existsSync(stationsBaseDir)) stationsBaseDir = path.join(UTILIDAD_DIR, "PUNTOS DE ESTACIONES");
  const stationIdByCodigo = new Map();

  for (const st of STATIONS_DATA) {
    const stFolder = path.join(stationsBaseDir, st.folder);
    const files = existsSync(stFolder) ? (await readdir(stFolder)).sort() : [];

    const jpgFiles = files.filter((f) => /\.jpe?g$/i.test(f));
    const pngFiles = files.filter((f) => /\.png$/i.test(f));

    const photoMediaList = [];
    for (let i = 0; i < jpgFiles.length; i++) {
      const jf = jpgFiles[i];
      const buf = await readFile(path.join(stFolder, jf));
      const slug = `estacion-${st.codigo.toLowerCase()}-foto-${i + 1}`;
      const media = await upsertMediaBuffer({
        buffer: buf,
        mimeType: "image/jpeg",
        nombreOriginal: jf,
        categoria: "estacion_foto",
        slug,
      });
      photoMediaList.push({ id: media.id, slug, filename: jf, orden: i + 1 });
    }

    const mainImageId = photoMediaList[0]?.id ?? null;

    const { rows: stRows } = await pool.query(
      `INSERT INTO estacion (
        codigo, slug, nombre, subtitulo, categoria_id, descripcion,
        codigo_qr, sound_key, sendero_id, ubicacion, lat, lng, orden, imagen_principal_id
      ) VALUES (
        $1, $2, $3, $4,
        COALESCE((SELECT id FROM categoria_estacion WHERE codigo = $5), (SELECT id FROM categoria_estacion WHERE codigo = 'mirador')),
        $6, $7, $8,
        (SELECT id FROM sendero WHERE slug = $9),
        ST_SetSRID(ST_MakePoint($11, $10), 4326), $10, $11, $12, $13
      )
      ON CONFLICT (codigo) DO UPDATE SET
        slug = EXCLUDED.slug,
        nombre = EXCLUDED.nombre,
        subtitulo = EXCLUDED.subtitulo,
        categoria_id = EXCLUDED.categoria_id,
        descripcion = EXCLUDED.descripcion,
        codigo_qr = EXCLUDED.codigo_qr,
        sound_key = EXCLUDED.sound_key,
        sendero_id = EXCLUDED.sendero_id,
        ubicacion = EXCLUDED.ubicacion,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        orden = EXCLUDED.orden,
        imagen_principal_id = COALESCE(EXCLUDED.imagen_principal_id, estacion.imagen_principal_id)
      RETURNING id`,
      [
        st.codigo,
        st.slug,
        st.nombre,
        st.subtitulo,
        st.categoria,
        st.descripcion,
        st.codigoQr,
        st.soundKey,
        st.rutaSlug,
        st.lat,
        st.lng,
        st.orden,
        mainImageId,
      ]
    );

    const estacionId = stRows[0].id;
    stationIdByCodigo.set(st.codigo, estacionId);

    // Sincronizar normas de la estación en estacion_norma (1FN)
    for (let i = 0; i < (st.normas || []).length; i++) {
      await pool.query(
        `INSERT INTO estacion_norma (estacion_id, orden, texto)
         VALUES ($1, $2, $3)
         ON CONFLICT (estacion_id, orden) DO UPDATE SET texto = EXCLUDED.texto`,
        [estacionId, i + 1, st.normas[i]]
      );
    }

    // Vincular todas las fotos de la estación en estacion_imagen
    for (const pm of photoMediaList) {
      await pool.query(
        `INSERT INTO estacion_imagen (estacion_id, imagen_id, titulo, descripcion, orden)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (estacion_id, imagen_id) DO UPDATE SET
           titulo = EXCLUDED.titulo,
           descripcion = EXCLUDED.descripcion,
           orden = EXCLUDED.orden`,
        [
          estacionId,
          pm.id,
          `${st.nombre} — Fotografía ${pm.orden}`,
          st.subtitulo,
          pm.orden,
        ]
      );
    }

    // Ingestar cada ilustración PNG de especie presente en la carpeta de la estación (3FN)
    for (const pf of pngFiles) {
      const rawKey = pf.replace(/-Photoroom\.png$/i, "").replace(/\.png$/i, "");
      const meta = SPECIES_METADATA[rawKey] || {
        nombreComun: rawKey
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        nombreMapudungun: null,
        nombreCientifico: rawKey,
        reino: "Fauna",
        grupo: "Aves acuáticas",
        categoria: "ave_acuatica",
        estado: "Preocupación Menor",
        habitat: st.nombre,
        descripcion: `Especie nativa registrada en ${st.nombre} dentro de la Reserva Comunitaria Bosque Humedal Angachilla.`,
        datoCurioso: `Forma parte de la biodiversidad protegida en ${st.nombre}.`,
      };

      const spSlug = `sp-${slugify(meta.nombreComun)}`;
      const imgSlug = `ilustracion-${slugify(meta.nombreComun)}`;
      const buf = await readFile(path.join(stFolder, pf));
      const media = await upsertMediaBuffer({
        buffer: buf,
        mimeType: "image/png",
        nombreOriginal: pf,
        categoria: "especie_ilustracion",
        slug: imgSlug,
      });

      const categoriaCodigo = meta.grupo === "Crustáceos" ? "crustaceo" : meta.categoria;

      const { rows: spRows } = await pool.query(
        `INSERT INTO especie (
          slug, nombre_comun, nombre_mapudungun, nombre_cientifico,
          categoria_id, estado_conservacion_id,
          habitat, descripcion, dato_curioso, sound_key, sound_label,
          ilustracion_id, foto_id, lat, lng
        ) VALUES (
          $1, $2, $3, $4,
          COALESCE((SELECT id FROM categoria_especie WHERE codigo = $5), (SELECT id FROM categoria_especie WHERE codigo = 'ave_acuatica')),
          COALESCE((SELECT id FROM estado_conservacion WHERE nombre = $6), (SELECT id FROM estado_conservacion WHERE codigo = 'preocupacion_menor')),
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15
        )
        ON CONFLICT (slug) DO UPDATE SET
          nombre_comun = EXCLUDED.nombre_comun,
          nombre_mapudungun = COALESCE(EXCLUDED.nombre_mapudungun, especie.nombre_mapudungun),
          nombre_cientifico = EXCLUDED.nombre_cientifico,
          categoria_id = EXCLUDED.categoria_id,
          estado_conservacion_id = EXCLUDED.estado_conservacion_id,
          habitat = EXCLUDED.habitat,
          descripcion = EXCLUDED.descripcion,
          dato_curioso = EXCLUDED.dato_curioso,
          sound_key = COALESCE(EXCLUDED.sound_key, especie.sound_key),
          sound_label = COALESCE(EXCLUDED.sound_label, especie.sound_label),
          ilustracion_id = EXCLUDED.ilustracion_id,
          foto_id = EXCLUDED.foto_id,
          lat = COALESCE(especie.lat, EXCLUDED.lat),
          lng = COALESCE(especie.lng, EXCLUDED.lng)
        RETURNING id`,
        [
          spSlug,
          meta.nombreComun,
          meta.nombreMapudungun ?? null,
          meta.nombreCientifico,
          categoriaCodigo,
          meta.estado,
          meta.habitat,
          meta.descripcion,
          meta.datoCurioso,
          meta.soundKey ?? null,
          meta.soundLabel ?? null,
          media.id,
          mainImageId,
          st.lat,
          st.lng,
        ]
      );

      await pool.query(
        `INSERT INTO estacion_especie (estacion_id, especie_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [estacionId, spRows[0].id]
      );
    }
  }

  // 7. Insertar especies de Flora y Fauna complementarias de TEXTO S1..S6 (usando sólo imágenes del sendero/estaciones)
  for (const ex of EXTRA_SPECIES_LIST) {
    let fotoId = null;
    if (ex.mediaSlug) {
      const mRes = await pool.query("SELECT id FROM imagen_archivo WHERE slug = $1", [ex.mediaSlug]);
      fotoId = mRes.rows[0]?.id ?? null;
    }
    const firstStation = STATIONS_DATA.find((s) => s.codigo === ex.stations?.[0]) ?? STATIONS_DATA[0];

    const { rows: spRows } = await pool.query(
      `INSERT INTO especie (
        slug, nombre_comun, nombre_mapudungun, nombre_cientifico,
        categoria_id, estado_conservacion_id,
        habitat, descripcion, dato_curioso, sound_key, sound_label,
        ilustracion_id, foto_id, lat, lng
      ) VALUES (
        $1, $2, $3, $4,
        COALESCE((SELECT id FROM categoria_especie WHERE codigo = $5), (SELECT id FROM categoria_especie WHERE codigo = 'ave_acuatica')),
        COALESCE((SELECT id FROM estado_conservacion WHERE nombre = $6), (SELECT id FROM estado_conservacion WHERE codigo = 'preocupacion_menor')),
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15
      )
      ON CONFLICT (slug) DO UPDATE SET
        nombre_comun = EXCLUDED.nombre_comun,
        nombre_mapudungun = EXCLUDED.nombre_mapudungun,
        nombre_cientifico = EXCLUDED.nombre_cientifico,
        categoria_id = EXCLUDED.categoria_id,
        estado_conservacion_id = EXCLUDED.estado_conservacion_id,
        habitat = EXCLUDED.habitat,
        descripcion = EXCLUDED.descripcion,
        dato_curioso = EXCLUDED.dato_curioso,
        foto_id = EXCLUDED.foto_id,
        ilustracion_id = EXCLUDED.ilustracion_id
      RETURNING id`,
      [
        ex.slug,
        ex.nombreComun,
        ex.nombreMapudungun ?? null,
        ex.nombreCientifico,
        ex.categoria,
        ex.estado,
        ex.habitat,
        ex.descripcion,
        ex.datoCurioso,
        ex.soundKey ?? null,
        ex.soundLabel ?? null,
        fotoId,
        fotoId,
        firstStation.lat,
        firstStation.lng,
      ]
    );

    for (const stCode of ex.stations || []) {
      const stId = stationIdByCodigo.get(stCode);
      if (stId) {
        await pool.query(
          `INSERT INTO estacion_especie (estacion_id, especie_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [stId, spRows[0].id]
        );
      }
    }
  }

  // 8. Guardar contenidos institucionales
  for (const [slug, data] of Object.entries(INSTITUTIONAL_CONTENT)) {
    await pool.query(
      `INSERT INTO contenido_institucional (slug, titulo, subtitulo, cuerpo_json, actualizado_en)
       VALUES ($1, $2, $3, $4::jsonb, now())
       ON CONFLICT (slug) DO UPDATE SET
         titulo = EXCLUDED.titulo,
         subtitulo = EXCLUDED.subtitulo,
         cuerpo_json = EXCLUDED.cuerpo_json,
         actualizado_en = now()`,
      [slug, data.titulo, data.subtitulo, JSON.stringify(data)]
    );
  }

  // 9. Poblar Avisos Oficiales y Calendario de Eventos en PostgreSQL (usando FKs normalizadas e imágenes del sendero)
  const { rows: noticeCount } = await pool.query("SELECT COUNT(*)::int AS c FROM aviso_oficial");
  if (noticeCount[0].c === 0) {
    const getImgId = async (slug) => {
      const r = await pool.query("SELECT id FROM imagen_archivo WHERE slug = $1", [slug]);
      return r.rows[0]?.id ?? null;
    };

    const imgS3 = await getImgId("estacion-s3-foto-1");
    const imgS5 = await getImgId("estacion-s5-foto-1");
    const imgS1 = await getImgId("estacion-s1-foto-1");
    const imgE7 = await getImgId("estacion-e7-foto-1");

    await pool.query(
      `INSERT INTO aviso_oficial (titulo, resumen, contenido, categoria_id, autor, imagen_id, fijado, activo_en_banner)
       VALUES
       ($1, $2, $3, (SELECT id FROM categoria_aviso WHERE codigo = 'biodiversidad'), 'Comité Ecológico Humedal Angachilla', $4, true, true),
       ($5, $6, $7, (SELECT id FROM categoria_aviso WHERE codigo = 'alerta'), 'Guardaparques Reserva Comunitaria', $8, true, true),
       ($9, $10, $11, (SELECT id FROM categoria_aviso WHERE codigo = 'taller'), 'Comité Ecológico & Municipalidad de Valdivia', $12, false, true),
       ($13, $14, $15, (SELECT id FROM categoria_aviso WHERE codigo = 'limpieza'), 'Comité Ecológico Humedal Angachilla', $16, false, false)`,
      [
        "Temporada de Nidificación en el Totoral y Espejo del Angachilla",
        "Se solicita transitar en silencio por los miradores S3 y S4 y evitar el ingreso con mascotas para proteger a las aves acuáticas.",
        "Durante esta temporada diversas especies como el Cisne de Cuello Negro, el Siete Colores, el Trabajador y la Tagua Común utilizan los pajonales de totora para construir sus nidos y criar a sus polluelos. Recuerda mantenerte exclusivamente en los senderos habilitados y emitir el menor ruido posible.",
        imgS3,
        "Protección de Madrigueras y Chimeneas del Camarón de Vega en Bosque Los Canelos",
        "En la Estación 5 el suelo húmedo presenta chimeneas de barro construidas por el Camarón de Hualve (Parastacus nicoleti). No salgas del sendero.",
        "El Bosque Los Canelos mantiene un suelo permanentemente saturado de agua donde habita el camarón de vega y crecen hongos nativos y enredaderas como el Voqui Blanco. Está estrictamente prohibido introducir objetos en los orificios, extraer tierra de hoja o recolectar funga y plantas.",
        imgS5,
        "Programa de Recorridos Guiados de Educación Ambiental en la Reserva Comunitaria",
        "Actividades gratuitas y abiertas para toda la comunidad valdiviana en el Circuito Angachilla y Auditorio Vivo.",
        "En el marco del programa de infraestructura sustentable y educación ambiental apoyado por CORFO y desarrollado por el Comité Ecológico Humedal Angachilla junto a la Ilustre Municipalidad de Valdivia, invitamos a escuelas, familias y vecinos a inscribirse en las caminatas interpretativas del mes.",
        imgS1,
        "Jornada Comunitaria de Restauración y Cuidado en Placita de la Resistencia",
        "Encuentro vecinal de mantención de senderos y control de especies invasoras desde las 10:00 hrs.",
        "Convocamos a las vecinas y vecinos a sumarse a la jornada colaborativa de cuidado de nuestra Reserva Comunitaria Bosque Humedal Angachilla. Punto de encuentro: Placita de la Resistencia.",
        imgE7,
      ]
    );
  }

  const getImgId = async (slug) => {
    const r = await pool.query("SELECT id FROM imagen_archivo WHERE slug = $1", [slug]);
    return r.rows[0]?.id ?? null;
  };
  const imgS1 = await getImgId("estacion-s1-foto-1");
  const imgS2 = await getImgId("estacion-s2-foto-1");
  const imgS3 = await getImgId("estacion-s3-foto-1");
  const imgS4 = await getImgId("estacion-s4-foto-1");
  const imgS5 = await getImgId("estacion-s5-foto-1");
  const imgE8 = await getImgId("estacion-e8-foto-1");

  await pool.query(
    `ALTER TABLE evento ADD COLUMN IF NOT EXISTS inscritos_base INTEGER NOT NULL DEFAULT 0`
  );

  // Asegurar 6 actividades distribuidas en el mes y asociadas a las 2 rutas y estaciones con fotos del sendero
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");

  const seedEvents = [
    {
      titulo: "Caminata Interpretativa: Regeneración del Hualve y Flora Pionera",
      descripcion:
        "Recorrido guiado desde la Placita de la Resistencia hacia la Estación 1 (Mirador del Hualve) para observar el proceso de restauración ecológica, el pantano de chequenes y las aves de matorral.",
      fecha: `${y}-${m}-18`,
      horario: "10:00 - 12:00 hrs",
      lugarNombre: "Estación 1: Mirador del Hualve",
      estacionId: stationIdByCodigo.get("S1"),
      rutaSlug: "ruta-circuito",
      lat: -39.85655,
      lng: -73.23775,
      catCodigo: "educativo",
      cupos: 20,
      organizador: "Comité Ecológico Humedal Angachilla",
      imagenId: imgS1,
      inscritosIniciales: 15,
    },
    {
      titulo: "Avistamiento Guiado de Aves Acuáticas en el Espejo del Angachilla",
      descripcion:
        "Recorrido interpretativo por las estaciones S1, S3 y S4 del Circuito Angachilla para observar en silencio al Cisne de Cuello Negro, Garza Cuca, Tagua, Pimpollo y Siete Colores en su hábitat natural.",
      fecha: `${y}-${m}-25`,
      horario: "09:30 - 11:30 hrs",
      lugarNombre: "Estación 3: Mirador Espejo del Angachilla",
      estacionId: stationIdByCodigo.get("S3"),
      rutaSlug: "ruta-circuito",
      lat: -39.85555,
      lng: -73.2405,
      catCodigo: "avistamiento",
      cupos: 25,
      organizador: "Comité Ecológico Humedal Angachilla",
      imagenId: imgS3,
      inscritosIniciales: 18,
    },
    {
      titulo: "Caminata Botánica: Bosque Inundable de Canelos, Pitras y Voqui Blanco",
      descripcion:
        "Exploración guiada por la ruta Bosque Los Canelos para conocer los cuatro árboles nativos que combaten inundaciones (canelo, arrayán, temu y pitra), las chimeneas del camarón de vega y el mimetismo del Voqui Blanco.",
      fecha: `${y}-${m}-26`,
      horario: "11:00 - 13:00 hrs",
      lugarNombre: "Estación 5: Bosque Los Canelos",
      estacionId: stationIdByCodigo.get("S5"),
      rutaSlug: "ruta-canelos",
      lat: -39.85845,
      lng: -73.2371,
      catCodigo: "educativo",
      cupos: 20,
      organizador: "Comité Ecológico Humedal Angachilla",
      imagenId: imgS5,
      inscritosIniciales: 14,
    },
    {
      titulo: "Taller de Anfibios del Humedal: Rana Grande Chilena y Sapito de Cuatro Ojos",
      descripcion:
        "Jornada de educación ambiental en la Laguna de los Pinos sobre el ciclo de vida de los renacuajos, el rol de los helechos Costilla de Vaca y la conservación hídrica del estero.",
      fecha: `${y}-${m}-28`,
      horario: "15:30 - 17:00 hrs",
      lugarNombre: "Estación 2: Laguna de los Pinos",
      estacionId: stationIdByCodigo.get("S2"),
      rutaSlug: "ruta-circuito",
      lat: -39.8562,
      lng: -73.2392,
      catCodigo: "educativo",
      cupos: 18,
      organizador: "Programa Educación Ambiental Angachilla",
      imagenId: imgS2,
      inscritosIniciales: 11,
    },
    {
      titulo: "Jornada de Observación del Pajonal en el Totoral del Santuario",
      descripcion:
        "Visita guiada a la Estación 4 para comprender cómo las plantas palustres (totora, batro, cortadera y junquillo) filtran el agua y sostienen los nidos del Siete Colores y el Trabajador.",
      fecha: `${y}-${m}-29`,
      horario: "10:30 - 12:30 hrs",
      lugarNombre: "Estación 4: Totoral del Santuario",
      estacionId: stationIdByCodigo.get("S4"),
      rutaSlug: "ruta-circuito",
      lat: -39.85515,
      lng: -73.2389,
      catCodigo: "avistamiento",
      cupos: 22,
      organizador: "Comité Ecológico Humedal Angachilla",
      imagenId: imgS4,
      inscritosIniciales: 16,
    },
    {
      titulo: "Encuentro de Escucha Bioacústica y Conservación en el Auditorio Vivo",
      descripcion:
        "Sesión abierta en la ruta Bosque Los Canelos para aprender a identificar los cantos del Diucón, Loica, Tenca y Rayadito usando la guía de especies y herramientas de ciencia ciudadana.",
      fecha: `${y}-${m}-30`,
      horario: "10:00 - 12:30 hrs",
      lugarNombre: "Auditorio Vivo & Placita de la Resistencia",
      estacionId: stationIdByCodigo.get("E8"),
      rutaSlug: "ruta-canelos",
      lat: -39.85745,
      lng: -73.23725,
      catCodigo: "comunitario",
      cupos: 30,
      organizador: "Comité Ecológico & Vecinos de Angachilla",
      imagenId: imgE8,
      inscritosIniciales: 21,
    },
  ];

  for (const ev of seedEvents) {
    const { rows: existingEv } = await pool.query(
      `SELECT id FROM evento WHERE titulo = $1 LIMIT 1`,
      [ev.titulo]
    );
    const evId = existingEv[0]?.id;
    if (!evId) {
      await pool.query(
        `INSERT INTO evento (
          titulo, descripcion, fecha, horario, lugar_nombre, estacion_id,
          sendero_id, lat, lng, categoria_id, cupos, inscritos_base, organizador, imagen_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          (SELECT id FROM sendero WHERE slug = $7),
          $8, $9,
          (SELECT id FROM categoria_evento WHERE codigo = $10),
          $11, $12, $13, $14
        )`,
        [
          ev.titulo,
          ev.descripcion,
          ev.fecha,
          ev.horario,
          ev.lugarNombre,
          ev.estacionId,
          ev.rutaSlug,
          ev.lat,
          ev.lng,
          ev.catCodigo,
          ev.cupos,
          ev.inscritosIniciales,
          ev.organizador,
          ev.imagenId,
        ]
      );
    } else {
      await pool.query(
        `UPDATE evento SET
           sendero_id = (SELECT id FROM sendero WHERE slug = $2),
           estacion_id = COALESCE($3, estacion_id),
           imagen_id = COALESCE($4, imagen_id),
           inscritos_base = CASE WHEN inscritos_base = 0 THEN $5 ELSE inscritos_base END
         WHERE id = $1`,
        [evId, ev.rutaSlug, ev.estacionId, ev.imagenId, ev.inscritosIniciales]
      );
    }
  }

  // 10. Poblar y actualizar MongoDB (feed_posts, comments, route_alerts) con registros reales de las estaciones y rutas
  const postsCol = feedPostsCol();
  const existingPostsCount = await postsCol.countDocuments();
  if (existingPostsCount === 0) {
    const now = new Date();
    const initialPosts = [
      {
        type: "post",
        title: "Vista panorámica desde el Mirador Espejo del Angachilla (Estación 3)",
        summary: "Registro matinal del espejo de agua rodeado de totorales y bosque nativo.",
        content:
          "Hoy recorrimos el Circuito Angachilla hasta la Estación 3. El nivel del agua en el espejo permite observar garzas cucas, patos jergones y taguas alimentándose entre las plantas acuáticas. Recordemos mantener limpias las vías de aguas lluvias de nuestro barrio, ya que todo drena hacia este santuario.",
        category: "biodiversidad",
        imageUrl: "/api/media/slug/estacion-s3-foto-1",
        visitedPlace: "Estación 3: Mirador Espejo del Angachilla",
        stationCodigo: "S3",
        routeSlug: "ruta-circuito",
        tags: ["Mirador", "Espejo de Agua", "Aves"],
        aspectRatio: "wide",
        authorId: null,
        authorName: "Comité Ecológico Humedal Angachilla",
        authorEmail: "comitebosquehumedal@gmail.com",
        authorAvatar: "/api/media/slug/svg-simbolo-angachilla-app",
        status: "aprobado",
        likesCount: 18,
        commentsCount: 2,
        reviewedBy: "Comité Ecológico",
        reviewedAt: now.toISOString(),
        createdAt: new Date(now.getTime() - 3600 * 1000 * 48),
      },
      {
        type: "photo_pin",
        title: "Sotobosque húmedo en la ruta Bosque Los Canelos (Estación 5)",
        summary: "Canelos, arrayanes, temus y pitras filtrando el agua de lluvia hacia el humedal.",
        content:
          "Caminata por el sendero sur en el Bosque Los Canelos. Se aprecian los troncos rugosos de las pitras y el microclima húmedo donde habita el camarón de vega y trepa el copihue.",
        category: "comunidad",
        imageUrl: "/api/media/slug/estacion-s5-foto-1",
        visitedPlace: "Estación 5: Bosque Los Canelos",
        stationCodigo: "S5",
        routeSlug: "ruta-canelos",
        tags: ["Bosque", "Canelos", "Senderos"],
        aspectRatio: "tall",
        authorId: null,
        authorName: "Guardaparques Reserva Angachilla",
        authorEmail: "comitebosquehumedal@gmail.com",
        authorAvatar: "/api/media/slug/svg-simbolo-angachilla-app",
        status: "aprobado",
        likesCount: 14,
        commentsCount: 1,
        reviewedBy: "Comité Ecológico",
        reviewedAt: now.toISOString(),
        createdAt: new Date(now.getTime() - 3600 * 1000 * 36),
      },
      {
        type: "photo_pin",
        title: "Pajonal y totoras en la Estación 4: Totoral del Santuario",
        summary: "Hábitat de nidificación del Siete Colores y el Trabajador.",
        content:
          "El pajonal de batros, totoras y cortaderas actúa como filtro biológico natural del estero Angachilla. Caminando en silencio se escucha el canto del Siete Colores y el Pidén.",
        category: "biodiversidad",
        imageUrl: "/api/media/slug/estacion-s4-foto-1",
        visitedPlace: "Estación 4: Totoral del Santuario",
        stationCodigo: "S4",
        routeSlug: "ruta-circuito",
        tags: ["Totoral", "Aves", "Flora"],
        aspectRatio: "tall",
        authorId: null,
        authorName: "Monitor Educación Ambiental",
        authorEmail: "comitebosquehumedal@gmail.com",
        authorAvatar: "/api/media/slug/svg-simbolo-angachilla-app",
        status: "aprobado",
        likesCount: 21,
        commentsCount: 0,
        reviewedBy: "Comité Ecológico",
        reviewedAt: now.toISOString(),
        createdAt: new Date(now.getTime() - 3600 * 1000 * 24),
      },
      {
        type: "photo_pin",
        title: "Vega de la Garza (Estación 6) tras las lluvias en Valdivia",
        summary: "Planicie de afloramiento hídrico y refugio de aves acuáticas y de pradera.",
        content:
          "La conexión subterránea con el estero Angachilla inunda periódicamente la vega creando un espejo somero donde descansan bandurrias, queltehues, garzas y patos nativos.",
        category: "comunidad",
        imageUrl: "/api/media/slug/estacion-s6-foto-1",
        visitedPlace: "Estación 6: Vega de la Garza",
        stationCodigo: "S6",
        routeSlug: "ruta-circuito",
        tags: ["Vega", "Aves", "Humedal"],
        aspectRatio: "wide",
        authorId: null,
        authorName: "Vecinos Reserva Angachilla",
        authorEmail: "comitebosquehumedal@gmail.com",
        authorAvatar: "/api/media/slug/svg-simbolo-angachilla-app",
        status: "aprobado",
        likesCount: 16,
        commentsCount: 0,
        reviewedBy: "Comité Ecológico",
        reviewedAt: now.toISOString(),
        createdAt: new Date(now.getTime() - 3600 * 1000 * 12),
      },
      {
        type: "photo_pin",
        title: "Laguna de los Pinos (Estación 2) y helechos Costilla de Vaca",
        summary: "Refugio reproductivo de la Rana Grande Chilena y el Sapito de Cuatro Ojos.",
        content:
          "En el borde entre la laguna estacionaria y el bosque se despliegan los grandes helechos Costilla de Vaca (Blechnum chilense). Cuidemos la calidad del agua sin arrojar objetos.",
        category: "biodiversidad",
        imageUrl: "/api/media/slug/estacion-s2-foto-1",
        visitedPlace: "Estación 2: Laguna de los Pinos",
        stationCodigo: "S2",
        routeSlug: "ruta-circuito",
        tags: ["Anfibios", "Laguna", "Flora"],
        aspectRatio: "square",
        authorId: null,
        authorName: "Educación Ambiental Angachilla",
        authorEmail: "comitebosquehumedal@gmail.com",
        authorAvatar: "/api/media/slug/svg-simbolo-angachilla-app",
        status: "aprobado",
        likesCount: 19,
        commentsCount: 0,
        reviewedBy: "Comité Ecológico",
        reviewedAt: now.toISOString(),
        createdAt: new Date(now.getTime() - 3600 * 1000 * 6),
      },
    ];

    const inserted = await postsCol.insertMany(initialPosts);
    const firstId = inserted.insertedIds[0]?.toString();
    const secondId = inserted.insertedIds[1]?.toString();

    if (firstId && secondId) {
      await commentsCol().insertMany([
        {
          postId: firstId,
          userId: null,
          authorName: "Vecina Sector Angachilla",
          authorAvatar: "/api/media/slug/svg-simbolo-angachilla-app",
          text: "¡Hermoso registro del Espejo del Angachilla! Ayer vimos dos parejas de cisnes con sus pichones cerca del totoral.",
          createdAt: new Date(now.getTime() - 3600 * 1000 * 20),
        },
        {
          postId: firstId,
          userId: null,
          authorName: "Comité Ecológico Humedal Angachilla",
          authorAvatar: "/api/media/slug/svg-simbolo-angachilla-app",
          text: "Gracias por compartir. Recordemos observar desde el mirador en silencio para proteger su nidificación.",
          createdAt: new Date(now.getTime() - 3600 * 1000 * 15),
        },
        {
          postId: secondId,
          userId: null,
          authorName: "Guía de Biodiversidad",
          authorAvatar: "/api/media/slug/svg-simbolo-angachilla-app",
          text: "Las pitras y canelos en ese sector mantienen la humedad perfecta durante todo el año.",
          createdAt: new Date(now.getTime() - 3600 * 1000 * 10),
        },
      ]);
    }
  } else {
    // Asegurar que los posts existentes tengan routeSlug para el filtro por ruta en el mapa
    await postsCol.updateMany(
      { stationCodigo: { $in: ["S1", "S2", "S3", "S4", "S6", "E7"] }, routeSlug: { $exists: false } },
      { $set: { routeSlug: "ruta-circuito" } }
    );
    await postsCol.updateMany(
      { stationCodigo: { $in: ["S5", "E8", "E9"] }, routeSlug: { $exists: false } },
      { $set: { routeSlug: "ruta-canelos" } }
    );
  }

  const alertsCol = routeAlertsCol();
  if ((await alertsCol.countDocuments()) === 0) {
    const now = new Date();
    await alertsCol.insertMany([
      {
        type: "fauna",
        title: "Nidificación activa en Estación 4: Totoral del Santuario",
        description: "Parejas de Siete Colores y Cisnes de Cuello Negro con polluelos. Mantener silencio absoluto.",
        coordinates: [-39.85515, -73.2389],
        reportedBy: "Comité Ecológico",
        createdAt: new Date(now.getTime() - 1800 * 1000),
      },
      {
        type: "resbaladizo",
        title: "Suelo húmedo y chimeneas de camarón en Bosque Los Canelos (S5)",
        description: "Transita exclusivamente por la huella demarcada sin pisar las chimeneas de barro.",
        coordinates: [-39.85845, -73.2371],
        reportedBy: "Guardaparques Angachilla",
        createdAt: new Date(now.getTime() - 3600 * 1000),
      },
    ]);
  }

  console.log("Seed de activos reales y normalización 3FN completado.");
}
