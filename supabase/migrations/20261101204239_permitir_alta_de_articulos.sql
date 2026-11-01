/*
# Permitir dar de alta artículos desde la tienda

## Resumen
El personal con sesión iniciada puede agregar artículos nuevos al catálogo.
Las reglas de la tabla (código único, precio y existencias no negativos, textos
no vacíos) siguen aplicando a cada alta.

## 1. Tablas modificadas
- `articulos`: se permite insertar filas a personas con sesión iniciada.

## 2. Seguridad
- Permiso de INSERT solo para el rol `authenticated`.
- Sin permiso para editar ni eliminar artículos desde la app.

## 3. Notas importantes
1. Esta migración es repetible: usa DROP POLICY IF EXISTS antes de crear la política.
2. No modifica ni elimina datos existentes.
*/

GRANT INSERT ON articulos TO authenticated;

DROP POLICY IF EXISTS "insert_articulos_tienda" ON articulos;
CREATE POLICY "insert_articulos_tienda" ON articulos FOR INSERT
  TO authenticated WITH CHECK (true);
