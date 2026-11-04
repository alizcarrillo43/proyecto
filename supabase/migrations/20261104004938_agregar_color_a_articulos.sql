/*
# Agregar columna color a artículos

## Resumen
Permite duplicar un modelo con el mismo código de barras pero diferente color,
manteniendo la restricción de unicidad sobre (codigo, talla, color) en lugar de (codigo, talla).

## Cambios
1. articulos: nueva columna `color` (text, por defecto cadena vacía).
2. articulos: se elimina la restricción UNIQUE(codigo, talla) y se crea UNIQUE(codigo, talla, color).

## Notas
- No se borran ni modifican artículos existentes. Los artículos actuales reciben color = ''.
- La nueva restricción permite tener el mismo código+numero de talla en distintos colores.
*/

ALTER TABLE articulos ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '';

ALTER TABLE articulos DROP CONSTRAINT IF EXISTS articulos_codigo_talla_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'articulos_codigo_talla_color_key'
  ) THEN
    ALTER TABLE articulos ADD CONSTRAINT articulos_codigo_talla_color_key UNIQUE (codigo, talla, color);
  END IF;
END $$;
