/*
# Permitir editar y eliminar artículos (solo superusuario)

## Resumen en lenguaje sencillo
El superusuario puede modificar la descripción, el precio y las existencias de un artículo, y puede eliminarlo. Los empleados siguen sin poder cambiar ni borrar artículos.

## Cambios
1. Se agrega una restricción que impide existencias negativas.
2. Se otorga permiso de UPDATE solo sobre descripcion, precio y existencias (no sobre codigo ni talla).
3. Se otorga permiso de DELETE sobre articulos.
4. Políticas nuevas: UPDATE y DELETE solo para rol_actual() = 'superusuario'.

## Notas importantes
- Un artículo que ya aparece en ventas no se puede eliminar: detalle_venta lo protege (ON DELETE RESTRICT). Así se conserva el historial de ventas.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'articulos_existencias_no_negativas'
  ) THEN
    ALTER TABLE articulos
      ADD CONSTRAINT articulos_existencias_no_negativas CHECK (existencias >= 0);
  END IF;
END $$;

GRANT UPDATE (descripcion, precio, existencias) ON articulos TO authenticated;
GRANT DELETE ON articulos TO authenticated;

DROP POLICY IF EXISTS "update_articulos_superusuario" ON articulos;
CREATE POLICY "update_articulos_superusuario" ON articulos FOR UPDATE
  TO authenticated
  USING (rol_actual() = 'superusuario')
  WITH CHECK (rol_actual() = 'superusuario');

DROP POLICY IF EXISTS "delete_articulos_superusuario" ON articulos;
CREATE POLICY "delete_articulos_superusuario" ON articulos FOR DELETE
  TO authenticated
  USING (rol_actual() = 'superusuario');
