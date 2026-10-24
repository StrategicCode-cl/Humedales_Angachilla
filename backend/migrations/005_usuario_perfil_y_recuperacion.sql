-- Perfil de usuario (apellido opcional, nombre de usuario único) y recuperación de contraseña.

ALTER TABLE usuario
  ADD COLUMN apellido TEXT,
  ADD COLUMN usuario  TEXT;

-- Las cuentas existentes reciben un usuario derivado de su correo (ana.perez@x.cl -> ana.perez).
-- Si dos coinciden, la más nueva lleva un sufijo con parte de su id para seguir siendo única.
WITH base AS (
  SELECT
    id,
    creado_en,
    left(regexp_replace(lower(split_part(email, '@', 1)), '[^a-z0-9._]', '', 'g'), 24) AS b
  FROM usuario
),
limpio AS (
  SELECT id, creado_en, CASE WHEN length(b) < 3 THEN 'usuario' ELSE b END AS b FROM base
),
numerado AS (
  SELECT id, b, row_number() OVER (PARTITION BY b ORDER BY creado_en, id) AS n FROM limpio
)
UPDATE usuario u
SET usuario = CASE WHEN numerado.n = 1 THEN numerado.b ELSE numerado.b || '_' || left(replace(u.id::text, '-', ''), 5) END
FROM numerado
WHERE numerado.id = u.id;

ALTER TABLE usuario
  ALTER COLUMN usuario SET NOT NULL,
  ADD CONSTRAINT usuario_usuario_key UNIQUE (usuario),
  -- Minúsculas, números, punto y guion bajo; sin @ para no confundirse con un correo al iniciar sesión
  ADD CONSTRAINT usuario_usuario_formato CHECK (usuario ~ '^[a-z0-9._]{3,30}$'),
  ADD CONSTRAINT usuario_apellido_largo CHECK (apellido IS NULL OR length(apellido) <= 100);

-- Enlaces de recuperación: se guarda solo el hash SHA-256 del token enviado por correo
CREATE TABLE restablecimiento_clave (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expira_en   TIMESTAMPTZ NOT NULL,
  usado_en    TIMESTAMPTZ,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX restablecimiento_clave_usuario_idx ON restablecimiento_clave (usuario_id);
