-- ============================================================================
-- MIGRACIÓN 003: NORMALIZACIÓN RELACIONAL EN 3FN (TERCERA FORMA NORMAL)
-- Taxonomía Biológica (Reino -> Grupo Taxonómico -> Categoría Ecológica),
-- Estados de Conservación UICN/MMA y Catálogos Maestros de Entidades.
-- ============================================================================

-- 1. JERARQUÍA TAXONÓMICA DE ESPECIES (Fauna, Flora y Reino Fungi)
CREATE TABLE reino_biologico (
  id             SERIAL PRIMARY KEY,
  codigo         TEXT NOT NULL UNIQUE,
  nombre         TEXT NOT NULL UNIQUE,
  nombre_display TEXT NOT NULL,
  descripcion    TEXT NOT NULL,
  orden          SMALLINT NOT NULL DEFAULT 1
);

INSERT INTO reino_biologico (codigo, nombre, nombre_display, descripcion, orden) VALUES
  ('fauna', 'Fauna', 'Fauna Silvestre', 'Vertebrados e invertebrados nativos que habitan los espejos de agua, pajonales, hualves y bosques ribereños.', 1),
  ('flora', 'Flora', 'Flora y Vegetación Nativa', 'Árboles de hualve, arbustos, helechos, enredaderas y plantas acuáticas palustres que estructuran el ecosistema.', 2),
  ('fungi', 'Fungi', 'Reino Fungi (Funga)', 'Hongos descomponedores, parásitos y micorrícicos esenciales para el reciclaje de nutrientes del bosque húmedo valdiviano.', 3);

CREATE TABLE grupo_taxonomico (
  id          SERIAL PRIMARY KEY,
  codigo      TEXT NOT NULL UNIQUE,
  nombre      TEXT NOT NULL UNIQUE,
  reino_id    INTEGER NOT NULL REFERENCES reino_biologico(id) ON DELETE RESTRICT,
  descripcion TEXT NOT NULL,
  orden       SMALLINT NOT NULL DEFAULT 1
);

INSERT INTO grupo_taxonomico (codigo, nombre, reino_id, descripcion, orden) VALUES
  ('aves_acuaticas',    'Aves acuáticas',                 (SELECT id FROM reino_biologico WHERE codigo = 'fauna'), 'Aves nadadoras, zancudas, limícolas y especialistas del totoral y espejo de agua.', 1),
  ('aves_bosque',       'Aves de bosque y matorral',      (SELECT id FROM reino_biologico WHERE codigo = 'fauna'), 'Aves paseriformes, trepadoras, rapaces y de sotobosque asociadas al bosque templado.', 2),
  ('mamiferos',         'Mamíferos',                      (SELECT id FROM reino_biologico WHERE codigo = 'fauna'), 'Mamíferos semiacuáticos y terrestres nativos del humedal.', 3),
  ('anfibios',          'Anfibios',                       (SELECT id FROM reino_biologico WHERE codigo = 'fauna'), 'Ranas y sapitos endémicos dependientes de aguas oxigenadas y hojarasca húmeda.', 4),
  ('crustaceos',        'Crustáceos',                     (SELECT id FROM reino_biologico WHERE codigo = 'fauna'), 'Invertebrados excavadores de suelos saturados de hualve (camarón de vega).', 5),
  ('arboles_arbustos',  'Árboles y arbustos',             (SELECT id FROM reino_biologico WHERE codigo = 'flora'), 'Especies leñosas de bosque inundable (hualve), matorral nativo y helechos.', 6),
  ('plantas_acuaticas', 'Plantas acuáticas y trepadoras', (SELECT id FROM reino_biologico WHERE codigo = 'flora'), 'Macrófitas palustres emergentes (totoras, batros, cortaderas) y lianas del bosque.', 7),
  ('hongos',            'Hongos',                         (SELECT id FROM reino_biologico WHERE codigo = 'fungi'), 'Funga nativa lignícola, terrestre y simbiótica del bosque húmedo.', 8);

CREATE TABLE categoria_especie (
  id          SERIAL PRIMARY KEY,
  codigo      TEXT NOT NULL UNIQUE,
  codigo_ui   TEXT NOT NULL,
  nombre      TEXT NOT NULL UNIQUE,
  grupo_id    INTEGER NOT NULL REFERENCES grupo_taxonomico(id) ON DELETE RESTRICT,
  descripcion TEXT NOT NULL,
  orden       SMALLINT NOT NULL DEFAULT 1
);

INSERT INTO categoria_especie (codigo, codigo_ui, nombre, grupo_id, descripcion, orden) VALUES
  ('ave_acuatica',    'ave_acuatica',    'Aves Acuáticas y de Pajonal',            (SELECT id FROM grupo_taxonomico WHERE codigo = 'aves_acuaticas'),    'Cisnes, garzas, patos, taguas, zambullidores y aves de totoral.', 1),
  ('ave_bosque',      'ave_bosque',      'Aves de Bosque, Matorral y Rapaces',     (SELECT id FROM grupo_taxonomico WHERE codigo = 'aves_bosque'),       'Aves del dosel, sotobosque, praderas húmedas y rapaces.', 2),
  ('mamifero',        'mamifero',        'Mamíferos Nativos',                      (SELECT id FROM grupo_taxonomico WHERE codigo = 'mamiferos'),         'Roedores semiacuáticos y mamíferos silvestres del santuario.', 3),
  ('anfibio',         'anfibio',         'Anfibios del Humedal',                   (SELECT id FROM grupo_taxonomico WHERE codigo = 'anfibios'),          'Anfibios nativos y endémicos con reproducción acuática o terrestre húmeda.', 4),
  ('crustaceo',       'anfibio',         'Crustáceos e Invertebrados de Hualve',   (SELECT id FROM grupo_taxonomico WHERE codigo = 'crustaceos'),        'Crustáceos excavadores constructores de chimeneas en suelos inundables.', 5),
  ('arbol_arbusto',   'arbol_arbusto',   'Árboles, Arbustos y Helechos Nativos',   (SELECT id FROM grupo_taxonomico WHERE codigo = 'arboles_arbustos'),  'Flora arbórea y arbustiva del bosque valdiviano y pantanos de hualve.', 6),
  ('planta_acuatica', 'planta_acuatica', 'Plantas Acuáticas, Palustres y Lianas',  (SELECT id FROM grupo_taxonomico WHERE codigo = 'plantas_acuaticas'), 'Vegetación palustre biofiltradora y enredaderas del bosque húmedo.', 7),
  ('hongo',           'hongo',           'Hongos Nativos (Reino Fungi)',           (SELECT id FROM grupo_taxonomico WHERE codigo = 'hongos'),            'Especies fúngicas del suelo y madera del bosque humedal.', 8);

-- 2. CATÁLOGO MAESTRO DE ESTADOS DE CONSERVACIÓN (Elimina dependencia transitiva estado -> color)
CREATE TABLE estado_conservacion (
  id            SERIAL PRIMARY KEY,
  codigo        TEXT NOT NULL UNIQUE,
  sigla_uicn    TEXT NOT NULL UNIQUE,
  nombre        TEXT NOT NULL UNIQUE,
  color_estado  TEXT NOT NULL,
  nivel_amenaza SMALLINT NOT NULL,
  descripcion   TEXT NOT NULL
);

INSERT INTO estado_conservacion (codigo, sigla_uicn, nombre, color_estado, nivel_amenaza, descripcion) VALUES
  ('preocupacion_menor', 'LC', 'Preocupación Menor', 'bg-emerald-100 text-emerald-800 border-emerald-300', 1, 'Poblaciones abundantes y ampliamente distribuidas sin amenaza inmediata.'),
  ('casi_amenazada',     'NT', 'Casi Amenazada',     'bg-yellow-100 text-yellow-800 border-yellow-300',   2, 'Especie cercana a cumplir los umbrales de vulnerabilidad si se degrada su hábitat.'),
  ('vulnerable',         'VU', 'Vulnerable',         'bg-amber-100 text-amber-800 border-amber-300',      3, 'Enfrenta un alto riesgo de extinción en estado de vida silvestre a mediano plazo.'),
  ('en_peligro',         'EN', 'En Peligro',         'bg-rose-100 text-rose-800 border-rose-300',         4, 'Enfrenta un riesgo muy alto de extinción en su hábitat natural.'),
  ('peligro_critico',    'CR', 'En Peligro Crítico', 'bg-rose-200 text-rose-950 border-rose-500',         5, 'Enfrenta un riesgo extremadamente alto de extinción en estado silvestre.');

-- 3. NORMALIZACIÓN DE LA TABLA especie (Migración de datos y eliminación de columnas redundantes)
ALTER TABLE especie
  ADD COLUMN categoria_id INTEGER REFERENCES categoria_especie(id) ON DELETE RESTRICT,
  ADD COLUMN estado_conservacion_id INTEGER REFERENCES estado_conservacion(id) ON DELETE RESTRICT;

UPDATE especie s
SET categoria_id = CASE
  WHEN s.grupo = 'Crustáceos' THEN (SELECT id FROM categoria_especie WHERE codigo = 'crustaceo')
  ELSE COALESCE(
    (SELECT id FROM categoria_especie WHERE codigo = s.categoria),
    (SELECT id FROM categoria_especie WHERE codigo = 'ave_acuatica')
  )
END;

UPDATE especie s
SET estado_conservacion_id = COALESCE(
  (SELECT id FROM estado_conservacion WHERE nombre = s.estado_conservacion),
  (SELECT id FROM estado_conservacion WHERE codigo = 'preocupacion_menor')
);

ALTER TABLE especie
  ALTER COLUMN categoria_id SET NOT NULL,
  ALTER COLUMN estado_conservacion_id SET NOT NULL;

CREATE INDEX especie_categoria_id_idx ON especie(categoria_id);
CREATE INDEX especie_estado_conservacion_id_idx ON especie(estado_conservacion_id);

-- Eliminar columnas desnormalizadas de especie (3FN: reino y grupo se obtienen por JOIN categoria_especie -> grupo_taxonomico -> reino_biologico; color_estado por JOIN estado_conservacion)
ALTER TABLE especie
  DROP COLUMN reino,
  DROP COLUMN grupo,
  DROP COLUMN categoria,
  DROP COLUMN estado_conservacion,
  DROP COLUMN color_estado;

-- 4. CATÁLOGO DE CATEGORÍAS DE ARCHIVOS MULTIMEDIA (Normaliza imagen_archivo)
CREATE TABLE categoria_imagen (
  id          SERIAL PRIMARY KEY,
  codigo      TEXT NOT NULL UNIQUE,
  nombre      TEXT NOT NULL,
  descripcion TEXT NOT NULL
);

INSERT INTO categoria_imagen (codigo, nombre, descripcion) VALUES
  ('svg_oficial',         'Gráfica y Logos SVG Oficiales',       'Logotipos vectoriales e iconografía oficial de Angachilla App.'),
  ('textura_viva',        'Fondos de Texturas Vivas',            'Fotografías macro de texturas naturales del bosque humedal.'),
  ('institucional',       'Fotografía Institucional y Documental','Imágenes de los documentos oficiales, normas y actividades.'),
  ('estacion_foto',       'Fotografía Oficial de Estación',      'Fotografías reales de las 9 estaciones de monitoreo e interpretación.'),
  ('especie_ilustracion', 'Ilustración Científica de Especie',   'Ilustraciones naturalistas en PNG de flora, fauna y funga.'),
  ('especie_foto',        'Fotografía de Especie',               'Fotografías en terreno de especies del humedal.'),
  ('usuario_upload',      'Fotografía Subida por Comunidad',     'Registros fotográficos aportados por visitantes en el feed.'),
  ('general',             'Recurso Multimedia General',          'Otros recursos gráficos del sistema.');

ALTER TABLE imagen_archivo
  ADD COLUMN categoria_id INTEGER REFERENCES categoria_imagen(id) ON DELETE RESTRICT;

UPDATE imagen_archivo ia
SET categoria_id = COALESCE(
  (SELECT id FROM categoria_imagen WHERE codigo = ia.categoria),
  (SELECT id FROM categoria_imagen WHERE codigo = 'general')
);

ALTER TABLE imagen_archivo
  ALTER COLUMN categoria_id SET NOT NULL;

DROP INDEX IF EXISTS imagen_archivo_categoria_idx;
CREATE INDEX imagen_archivo_categoria_id_idx ON imagen_archivo(categoria_id);

ALTER TABLE imagen_archivo
  DROP COLUMN categoria;

-- 5. NORMALIZACIÓN DE ESTACIONES (categoria_estacion, sendero_id y tabla 1FN estacion_norma)
CREATE TABLE categoria_estacion (
  id          SERIAL PRIMARY KEY,
  codigo      TEXT NOT NULL UNIQUE,
  nombre      TEXT NOT NULL,
  descripcion TEXT NOT NULL
);

INSERT INTO categoria_estacion (codigo, nombre, descripcion) VALUES
  ('mirador',        'Mirador Interpretativo',   'Plataforma de observación escénica de aves y paisaje del humedal.'),
  ('pasarela',       'Pasarela Palustre',        'Sendero elevado sobre zonas de pajonal y suelo inundable.'),
  ('totem_qr',       'Tótem Educativo QR',       'Hito de interpretación ambiental y punto de encuentro comunitario.'),
  ('muelle',         'Muelle / Ribera',          'Acceso ribereño junto al espejo de agua o estero.'),
  ('torre',          'Torre de Avistamiento',    'Mirador de altura hacia el espejo de agua abierto.'),
  ('bano_ecologico', 'Equipamiento Ecológico',   'Infraestructura sustentable de apoyo al visitante.');

ALTER TABLE estacion
  ADD COLUMN categoria_id INTEGER REFERENCES categoria_estacion(id) ON DELETE RESTRICT,
  ADD COLUMN sendero_id UUID REFERENCES sendero(id) ON DELETE SET NULL;

UPDATE estacion e
SET
  categoria_id = COALESCE(
    (SELECT id FROM categoria_estacion WHERE codigo = e.categoria),
    (SELECT id FROM categoria_estacion WHERE codigo = 'mirador')
  ),
  sendero_id = (SELECT id FROM sendero s WHERE s.slug = e.ruta_slug);

ALTER TABLE estacion
  ALTER COLUMN categoria_id SET NOT NULL;

CREATE INDEX estacion_categoria_id_idx ON estacion(categoria_id);
CREATE INDEX estacion_sendero_id_idx ON estacion(sendero_id);

-- Tabla normalizada 1FN/3FN para las normas de cada estación (reemplaza el arreglo JSONB estacion.normas)
CREATE TABLE estacion_norma (
  id          SERIAL PRIMARY KEY,
  estacion_id UUID NOT NULL REFERENCES estacion(id) ON DELETE CASCADE,
  orden       SMALLINT NOT NULL DEFAULT 1,
  texto       TEXT NOT NULL,
  UNIQUE (estacion_id, orden)
);

INSERT INTO estacion_norma (estacion_id, orden, texto)
SELECT
  e.id,
  (ord.ordinality)::smallint,
  ord.elem
FROM estacion e
CROSS JOIN LATERAL jsonb_array_elements_text(e.normas) WITH ORDINALITY AS ord(elem, ordinality);

ALTER TABLE estacion
  DROP COLUMN categoria,
  DROP COLUMN ruta_slug,
  DROP COLUMN normas;

-- 6. NORMALIZACIÓN DE AVISOS OFICIALES (categoria_aviso)
CREATE TABLE categoria_aviso (
  id     SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL
);

INSERT INTO categoria_aviso (codigo, nombre) VALUES
  ('oficial',       'Comunicado Oficial'),
  ('biodiversidad', 'Biodiversidad y Conservación'),
  ('alerta',        'Alerta Ambiental / Cuidado'),
  ('taller',        'Educación Ambiental y Talleres'),
  ('limpieza',      'Minga y Restauración'),
  ('comunidad',     'Comunidad Angachilla');

ALTER TABLE aviso_oficial
  ADD COLUMN categoria_id INTEGER REFERENCES categoria_aviso(id) ON DELETE RESTRICT;

UPDATE aviso_oficial a
SET categoria_id = COALESCE(
  (SELECT id FROM categoria_aviso WHERE codigo = a.categoria),
  (SELECT id FROM categoria_aviso WHERE codigo = 'oficial')
);

ALTER TABLE aviso_oficial
  ALTER COLUMN categoria_id SET NOT NULL;

ALTER TABLE aviso_oficial
  DROP COLUMN categoria;

-- 7. NORMALIZACIÓN DE EVENTOS (categoria_evento y FK sendero_id; elimina ruta_slug y ruta_nombre redundantes)
CREATE TABLE categoria_evento (
  id     SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL
);

INSERT INTO categoria_evento (codigo, nombre) VALUES
  ('avistamiento', 'Avistamiento de Aves y Fauna'),
  ('limpieza',     'Jornada de Limpieza y Restauración'),
  ('educativo',    'Taller de Educación Ambiental'),
  ('fotografia',   'Fotografía de Naturaleza'),
  ('kayak',        'Recorrido Acuático'),
  ('comunitario',  'Encuentro Comunitario y Cultural');

ALTER TABLE evento
  ADD COLUMN categoria_id INTEGER REFERENCES categoria_evento(id) ON DELETE RESTRICT,
  ADD COLUMN sendero_id UUID REFERENCES sendero(id) ON DELETE SET NULL;

UPDATE evento ev
SET
  categoria_id = COALESCE(
    (SELECT id FROM categoria_evento WHERE codigo = ev.categoria),
    (SELECT id FROM categoria_evento WHERE codigo = 'educativo')
  ),
  sendero_id = (SELECT id FROM sendero s WHERE s.slug = ev.ruta_slug);

ALTER TABLE evento
  ALTER COLUMN categoria_id SET NOT NULL;

ALTER TABLE evento
  DROP COLUMN categoria,
  DROP COLUMN ruta_slug,
  DROP COLUMN ruta_nombre;

-- 8. NORMALIZACIÓN DE SUGERENCIAS Y DONACIONES
CREATE TABLE categoria_sugerencia (
  id     SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL
);

INSERT INTO categoria_sugerencia (codigo, nombre) VALUES
  ('infraestructura', 'Infraestructura y Pasarelas'),
  ('fauna',           'Protección de Flora, Fauna y Funga'),
  ('limpieza',        'Limpieza y Manejo de Residuos'),
  ('seguridad',       'Seguridad y Señalética'),
  ('educacion',       'Educación Ambiental');

CREATE TABLE estado_sugerencia (
  id     SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL
);

INSERT INTO estado_sugerencia (codigo, nombre) VALUES
  ('pendiente', 'Pendiente de Revisión'),
  ('aprobada',  'Aprobada / En Ejecución'),
  ('rechazada', 'Desestimada');

ALTER TABLE sugerencia
  ADD COLUMN categoria_id INTEGER REFERENCES categoria_sugerencia(id) ON DELETE RESTRICT,
  ADD COLUMN estado_id INTEGER REFERENCES estado_sugerencia(id) ON DELETE RESTRICT;

UPDATE sugerencia s
SET
  categoria_id = COALESCE(
    (SELECT id FROM categoria_sugerencia WHERE codigo = s.categoria),
    (SELECT id FROM categoria_sugerencia WHERE codigo = 'infraestructura')
  ),
  estado_id = COALESCE(
    (SELECT id FROM estado_sugerencia WHERE codigo = s.estado),
    (SELECT id FROM estado_sugerencia WHERE codigo = 'pendiente')
  );

ALTER TABLE sugerencia
  ALTER COLUMN categoria_id SET NOT NULL,
  ALTER COLUMN estado_id SET NOT NULL;

ALTER TABLE sugerencia
  DROP COLUMN categoria,
  DROP COLUMN estado;

CREATE TABLE proposito_donacion (
  id          SERIAL PRIMARY KEY,
  codigo      TEXT NOT NULL UNIQUE,
  nombre      TEXT NOT NULL,
  descripcion TEXT NOT NULL
);

INSERT INTO proposito_donacion (codigo, nombre, descripcion) VALUES
  ('mantenimiento_pasarelas', 'Mantención de Pasarelas y Miradores', 'Reparación y cuidado de infraestructura sustentable de acceso universal.'),
  ('reforestacion',           'Reforestación con Flora Nativa',      'Propagación y plantación de canelos, pitras, arrayanes, temus y notros.'),
  ('totems_qr',               'Tótems Educativos y Señalética QR',   'Mantención de señalética interpretativa en las estaciones del santuario.'),
  ('monitoreo_fauna',         'Monitoreo de Aves, Anfibios y Agua',  'Equipamiento para censos de avifauna, anfibios y calidad hídrica.'),
  ('general',                 'Fondo General Reserva Comunitaria',   'Aporte general para las 5 líneas de trabajo del Comité Ecológico.');

CREATE TABLE medio_pago (
  id     SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL
);

INSERT INTO medio_pago (codigo, nombre) VALUES
  ('transferencia', 'Transferencia Bancaria / CuentaRUT'),
  ('webpay',        'Webpay Plus / Pasarela Digital');

ALTER TABLE donacion
  ADD COLUMN proposito_id INTEGER REFERENCES proposito_donacion(id) ON DELETE RESTRICT,
  ADD COLUMN medio_pago_id INTEGER REFERENCES medio_pago(id) ON DELETE RESTRICT;

UPDATE donacion d
SET
  proposito_id = COALESCE(
    (SELECT id FROM proposito_donacion WHERE codigo = d.proposito),
    (SELECT id FROM proposito_donacion WHERE codigo = 'general')
  ),
  medio_pago_id = COALESCE(
    (SELECT id FROM medio_pago WHERE codigo = d.medio_pago),
    (SELECT id FROM medio_pago WHERE codigo = 'transferencia')
  );

ALTER TABLE donacion
  ALTER COLUMN proposito_id SET NOT NULL,
  ALTER COLUMN medio_pago_id SET NOT NULL;

ALTER TABLE donacion
  DROP COLUMN proposito,
  DROP COLUMN medio_pago;

-- 9. VISTAS RELACIONALES PARA CONSULTAS LIMPIAS DESDE LA API
CREATE OR REPLACE VIEW v_especie_completa AS
SELECT
  s.id,
  s.slug,
  s.nombre_comun,
  s.nombre_mapudungun,
  s.nombre_cientifico,
  s.categoria_id,
  ce.codigo AS categoria_codigo,
  ce.codigo_ui AS categoria,
  ce.nombre AS categoria_nombre,
  gt.id AS grupo_id,
  gt.codigo AS grupo_codigo,
  gt.nombre AS grupo,
  rb.id AS reino_id,
  rb.codigo AS reino_codigo,
  rb.nombre AS reino,
  rb.nombre_display AS reino_display,
  rb.orden AS reino_orden,
  s.estado_conservacion_id,
  ec.codigo AS estado_codigo,
  ec.sigla_uicn,
  ec.nombre AS estado_conservacion,
  ec.color_estado,
  ec.nivel_amenaza,
  s.habitat,
  s.descripcion,
  s.dato_curioso,
  s.sound_key,
  s.sound_label,
  s.ilustracion_id,
  il.slug AS ilustracion_slug,
  s.foto_id,
  fo.slug AS foto_slug,
  s.credito_autor,
  s.credito_licencia,
  s.credito_url,
  s.ebird_url,
  s.inaturalist_url,
  s.lat,
  s.lng,
  s.creado_en
FROM especie s
JOIN categoria_especie ce ON ce.id = s.categoria_id
JOIN grupo_taxonomico gt ON gt.id = ce.grupo_id
JOIN reino_biologico rb ON rb.id = gt.reino_id
JOIN estado_conservacion ec ON ec.id = s.estado_conservacion_id
LEFT JOIN imagen_archivo il ON il.id = s.ilustracion_id
LEFT JOIN imagen_archivo fo ON fo.id = s.foto_id;

CREATE OR REPLACE VIEW v_estacion_completa AS
SELECT
  e.id,
  e.codigo,
  e.slug,
  e.nombre,
  e.subtitulo,
  e.categoria_id,
  cat.codigo AS categoria,
  cat.nombre AS categoria_nombre,
  e.descripcion,
  e.codigo_qr,
  e.sound_key,
  e.sendero_id,
  COALESCE(se.slug, 'ruta-circuito') AS ruta_slug,
  COALESCE(se.nombre, 'Circuito Angachilla') AS ruta_nombre,
  e.ubicacion,
  e.lat,
  e.lng,
  e.orden,
  e.imagen_principal_id,
  ia.slug AS imagen_principal_slug,
  COALESCE(
    (
      SELECT jsonb_agg(en.texto ORDER BY en.orden ASC)
      FROM estacion_norma en
      WHERE en.estacion_id = e.id
    ),
    '[]'::jsonb
  ) AS normas,
  e.creado_en
FROM estacion e
JOIN categoria_estacion cat ON cat.id = e.categoria_id
LEFT JOIN sendero se ON se.id = e.sendero_id
LEFT JOIN imagen_archivo ia ON ia.id = e.imagen_principal_id;
