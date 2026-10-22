CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Almacenamiento binario de todas las imágenes y gráficos en la base de datos
CREATE TABLE imagen_archivo (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE,
  nombre_original TEXT NOT NULL,
  categoria       TEXT NOT NULL DEFAULT 'general',
  mime_type       TEXT NOT NULL,
  bytes           BYTEA NOT NULL,
  tamano_bytes    INTEGER NOT NULL,
  sha256          TEXT NOT NULL UNIQUE,
  subido_por      UUID REFERENCES usuario(id) ON DELETE SET NULL,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX imagen_archivo_categoria_idx ON imagen_archivo(categoria);

-- 2. Estaciones / Puntos de interés del humedal (con geometría PostGIS)
CREATE TABLE estacion (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo              TEXT NOT NULL UNIQUE,
  slug                TEXT NOT NULL UNIQUE,
  nombre              TEXT NOT NULL,
  subtitulo           TEXT,
  categoria           TEXT NOT NULL DEFAULT 'mirador',
  descripcion         TEXT NOT NULL,
  normas              JSONB NOT NULL DEFAULT '[]'::jsonb,
  codigo_qr           TEXT NOT NULL UNIQUE,
  sound_key           TEXT,
  ruta_slug           TEXT NOT NULL DEFAULT 'ruta-circuito',
  ubicacion           GEOMETRY(Point, 4326) NOT NULL,
  lat                 DOUBLE PRECISION NOT NULL,
  lng                 DOUBLE PRECISION NOT NULL,
  orden               SMALLINT NOT NULL DEFAULT 1,
  imagen_principal_id UUID REFERENCES imagen_archivo(id) ON DELETE SET NULL,
  creado_en           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX estacion_ubicacion_gix ON estacion USING GIST (ubicacion);

-- 3. Galería oficial de fotografías de cada estación / sector de la reserva
CREATE TABLE estacion_imagen (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estacion_id UUID NOT NULL REFERENCES estacion(id) ON DELETE CASCADE,
  imagen_id   UUID NOT NULL REFERENCES imagen_archivo(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  descripcion TEXT,
  orden       SMALLINT NOT NULL DEFAULT 1,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (estacion_id, imagen_id)
);

-- 4. Catálogo completo de especies (Fauna, Flora y Reino Fungi)
CREATE TABLE especie (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT NOT NULL UNIQUE,
  nombre_comun        TEXT NOT NULL,
  nombre_mapudungun   TEXT,
  nombre_cientifico   TEXT NOT NULL,
  reino               TEXT NOT NULL DEFAULT 'Fauna',
  grupo               TEXT NOT NULL DEFAULT 'Aves',
  categoria           TEXT NOT NULL DEFAULT 'ave_acuatica',
  estado_conservacion TEXT NOT NULL DEFAULT 'Preocupación Menor',
  color_estado        TEXT NOT NULL DEFAULT 'bg-emerald-100 text-emerald-800 border-emerald-300',
  habitat             TEXT NOT NULL,
  descripcion         TEXT NOT NULL,
  dato_curioso        TEXT,
  sound_key           TEXT,
  sound_label         TEXT,
  ilustracion_id      UUID REFERENCES imagen_archivo(id) ON DELETE SET NULL,
  foto_id             UUID REFERENCES imagen_archivo(id) ON DELETE SET NULL,
  credito_autor       TEXT,
  credito_licencia    TEXT,
  credito_url         TEXT,
  ebird_url           TEXT,
  inaturalist_url     TEXT,
  lat                 DOUBLE PRECISION,
  lng                 DOUBLE PRECISION,
  creado_en           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Relación N:M entre Estaciones y Especies avistadas en cada punto
CREATE TABLE estacion_especie (
  estacion_id UUID NOT NULL REFERENCES estacion(id) ON DELETE CASCADE,
  especie_id  UUID NOT NULL REFERENCES especie(id) ON DELETE CASCADE,
  PRIMARY KEY (estacion_id, especie_id)
);

-- 6. Senderos / Rutas GPX reales con geometría PostGIS
CREATE TABLE sendero (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  nombre            TEXT NOT NULL,
  dificultad        TEXT NOT NULL DEFAULT 'Fácil',
  minutos_estimados INTEGER NOT NULL,
  distancia_km      DOUBLE PRECISION NOT NULL,
  es_circuito       BOOLEAN NOT NULL DEFAULT true,
  color             TEXT NOT NULL DEFAULT '#047857',
  descripcion       TEXT NOT NULL,
  autor_gpx         TEXT,
  url_fuente        TEXT,
  fecha_grabacion   TEXT,
  puntos_json       JSONB NOT NULL,
  bounds_json       JSONB NOT NULL,
  checkpoints_json  JSONB NOT NULL DEFAULT '[]'::jsonb,
  trazado           GEOMETRY(LineString, 4326),
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sendero_trazado_gix ON sendero USING GIST (trazado);

-- 7. Contenidos institucionales (Acerca de la App, Reserva Comunitaria, Comité Ecológico, Apps Complementarias)
CREATE TABLE contenido_institucional (
  slug           TEXT PRIMARY KEY,
  titulo         TEXT NOT NULL,
  subtitulo      TEXT,
  cuerpo_json    JSONB NOT NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Avisos oficiales y alertas de la barra rotativa superior
CREATE TABLE aviso_oficial (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo           TEXT NOT NULL,
  resumen          TEXT NOT NULL,
  contenido        TEXT NOT NULL,
  categoria        TEXT NOT NULL DEFAULT 'oficial',
  autor            TEXT NOT NULL,
  imagen_id        UUID REFERENCES imagen_archivo(id) ON DELETE SET NULL,
  fijado           BOOLEAN NOT NULL DEFAULT false,
  activo_en_banner BOOLEAN NOT NULL DEFAULT true,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Calendario de actividades y eventos del humedal
CREATE TABLE evento (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo       TEXT NOT NULL,
  descripcion  TEXT NOT NULL,
  fecha        DATE NOT NULL,
  horario      TEXT NOT NULL,
  lugar_nombre TEXT NOT NULL,
  estacion_id  UUID REFERENCES estacion(id) ON DELETE SET NULL,
  ruta_slug    TEXT NOT NULL DEFAULT 'ruta-circuito',
  ruta_nombre  TEXT NOT NULL DEFAULT 'Circuito Angachilla',
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  categoria    TEXT NOT NULL DEFAULT 'educativo',
  cupos        INTEGER NOT NULL DEFAULT 25,
  organizador  TEXT NOT NULL DEFAULT 'Comité Ecológico Humedal Angachilla',
  imagen_id    UUID REFERENCES imagen_archivo(id) ON DELETE SET NULL,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inscripcion_evento (
  evento_id  UUID NOT NULL REFERENCES evento(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (evento_id, usuario_id)
);

-- 10. Sugerencias ciudadanas, Donaciones y Consultas de Contacto
CREATE TABLE sugerencia (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo           TEXT NOT NULL,
  descripcion      TEXT NOT NULL,
  categoria        TEXT NOT NULL DEFAULT 'infraestructura',
  estado           TEXT NOT NULL DEFAULT 'pendiente',
  autor_nombre     TEXT NOT NULL,
  autor_email      TEXT NOT NULL,
  usuario_id       UUID REFERENCES usuario(id) ON DELETE SET NULL,
  comentario_admin TEXT,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE donacion (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_recibo  TEXT NOT NULL UNIQUE,
  donante_nombre TEXT NOT NULL,
  donante_email  TEXT NOT NULL,
  usuario_id     UUID REFERENCES usuario(id) ON DELETE SET NULL,
  monto_clp      INTEGER NOT NULL CHECK (monto_clp >= 500),
  proposito      TEXT NOT NULL DEFAULT 'general',
  medio_pago     TEXT NOT NULL DEFAULT 'transferencia',
  estado         TEXT NOT NULL DEFAULT 'completada',
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE consulta_contacto (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre    TEXT NOT NULL,
  email     TEXT NOT NULL,
  asunto    TEXT NOT NULL,
  mensaje   TEXT NOT NULL,
  estado    TEXT NOT NULL DEFAULT 'recibido',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
