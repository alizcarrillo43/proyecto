/*
# Un código de barras por modelo

## Resumen en lenguaje sencillo
Todas las numeraciones de un mismo modelo comparten un solo código de barras. Ya no es necesario que cada talla tenga su propio código.

## Cambios
1. articulos: se elimina la restricción que exigía un código distinto para cada artículo.
2. articulos: se agrega una restricción que exige que no existan dos filas con el mismo código y la misma talla.

## Notas importantes
- No se borra ni modifica ningún artículo existente. Los artículos ya creados conservan su código actual.
- La búsqueda por código en Ventas debe elegir la talla cuando un código corresponde a varias numeraciones.
*/

ALTER TABLE articulos DROP CONSTRAINT IF EXISTS articulos_codigo_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'articulos_codigo_talla_key'
  ) THEN
    ALTER TABLE articulos ADD CONSTRAINT articulos_codigo_talla_key UNIQUE (codigo, talla);
  END IF;
END $$;
