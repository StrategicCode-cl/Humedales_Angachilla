-- Categorías de especie agregadas en el catálogo web: aves de totoral y reptiles.
-- Sin estas filas, guardar una especie con esos códigos cae en 'ave_acuatica' (COALESCE en las rutas).

INSERT INTO grupo_taxonomico (codigo, nombre, reino_id, descripcion, orden) VALUES
  ('reptiles', 'Reptiles', (SELECT id FROM reino_biologico WHERE codigo = 'fauna'), 'Lagartijas y otros reptiles nativos de praderas, bordes de bosque y troncos asoleados.', 9)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO categoria_especie (codigo, codigo_ui, nombre, grupo_id, descripcion, orden) VALUES
  ('ave_totoral', 'ave_totoral', 'Aves de Totoral',    (SELECT id FROM grupo_taxonomico WHERE codigo = 'aves_acuaticas'), 'Aves especialistas que anidan y se alimentan entre totoras, juncos y batros.', 9),
  ('reptil',      'reptil',      'Reptiles Nativos',   (SELECT id FROM grupo_taxonomico WHERE codigo = 'reptiles'),       'Reptiles nativos presentes en el santuario.', 10)
ON CONFLICT (codigo) DO NOTHING;
