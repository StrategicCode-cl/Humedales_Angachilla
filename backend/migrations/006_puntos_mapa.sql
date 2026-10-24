-- Puntos del mapa que agrega el guardaparques (puntos de vista y de actividad), aparte de los tótems QR.

CREATE TABLE punto_mapa (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         TEXT NOT NULL CHECK (length(nombre) BETWEEN 2 AND 120),
  tipo           TEXT NOT NULL CHECK (tipo IN ('vista', 'actividad')),
  -- Clave de un ícono del set precargado en el front (binoculars, bench, parking...)
  icono          TEXT NOT NULL DEFAULT 'binoculars' CHECK (icono ~ '^[a-z0-9-]{2,40}$'),
  descripcion    TEXT NOT NULL DEFAULT '' CHECK (length(descripcion) <= 2000),
  ubicacion      GEOMETRY(Point, 4326) NOT NULL,
  lat            DOUBLE PRECISION NOT NULL,
  lng            DOUBLE PRECISION NOT NULL,
  -- Ambos opcionales: un punto puede no pertenecer a ninguna ruta ni actividad
  sendero_id     UUID REFERENCES sendero (id) ON DELETE SET NULL,
  evento_id      UUID REFERENCES evento (id) ON DELETE SET NULL,
  imagen_id      UUID REFERENCES imagen_archivo (id) ON DELETE SET NULL,
  publicado      BOOLEAN NOT NULL DEFAULT true,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX punto_mapa_ubicacion_gix ON punto_mapa USING GIST (ubicacion);

-- Marca los tótems cuya ubicación corrigió un guardaparques: la carga inicial ya no la sobrescribe
ALTER TABLE estacion ADD COLUMN ubicacion_editada BOOLEAN NOT NULL DEFAULT false;
