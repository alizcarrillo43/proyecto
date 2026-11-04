/*
# Permitir editar el color de los artículos

## Resumen
El permiso UPDATE sobre la tabla `articulos` no incluía la columna `color`,
por lo que intentar cambiar el color de un artículo fallaba con un error de permisos.

## Cambios
1. Se otorga permiso de UPDATE sobre la columna `color` al rol `authenticated`.

## Notas
- No se modifican políticas ni otros permisos existentes.
- La política `update_articulos_superusuario` ya controla qué filas se pueden actualizar.
*/

GRANT UPDATE (color) ON articulos TO authenticated;
