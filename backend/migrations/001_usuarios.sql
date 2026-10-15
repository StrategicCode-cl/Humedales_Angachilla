CREATE TABLE rol (
  id     SMALLSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

INSERT INTO rol (nombre) VALUES ('visitante'), ('admin');

CREATE TABLE usuario (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT NOT NULL,
  -- Se guarda siempre en minúsculas para que el UNIQUE no distinga mayúsculas
  email         TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash TEXT NOT NULL,
  rol_id        SMALLINT NOT NULL REFERENCES rol (id),
  avatar_url    TEXT,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX usuario_rol_id_idx ON usuario (rol_id);
