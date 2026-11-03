/*
# Pausar artículos y permitir borrarlos aunque tengan ventas

## Resumen en lenguaje sencillo
1. Cada artículo puede pausarse. Un artículo en pausa no se puede vender, pero sigue en el catálogo.
2. El superusuario puede eliminar un artículo aunque tenga ventas. Las ventas anteriores se conservan completas en el historial, con su descripción, talla y precio de ese momento.
3. La venta rechaza artículos en pausa con un mensaje claro.

## Cambios
- articulos: nueva columna activo (boolean, por defecto true). Se otorga permiso de UPDATE sobre esa columna.
- detalle_venta: articulo_id acepta vacío y, al eliminar un artículo, la referencia queda en vacío (ON DELETE SET NULL) en lugar de bloquear el borrado. Ningún dato de venta se borra.
- registrar_venta: rechaza artículos con activo = false con el error articulo_pausado.

## Notas importantes
- Solo cambia la relación con el catálogo; los datos históricos de cada venta (descripción, talla, cantidad, precio) no se modifican.
*/

ALTER TABLE articulos ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;

GRANT UPDATE (descripcion, precio, existencias, activo) ON articulos TO authenticated;

ALTER TABLE detalle_venta ALTER COLUMN articulo_id DROP NOT NULL;

ALTER TABLE detalle_venta DROP CONSTRAINT IF EXISTS detalle_venta_articulo_id_fkey;
ALTER TABLE detalle_venta
  ADD CONSTRAINT detalle_venta_articulo_id_fkey
  FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.registrar_venta(p_lineas jsonb, p_metodo_pago text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
v_usuario uuid := auth.uid();
v_venta_id uuid;
v_folio text;
v_total numeric(10,2) := 0;
v_linea jsonb;
v_articulo articulos%ROWTYPE;
v_cantidad integer;
v_subtotal numeric(10,2);
BEGIN
IF rol_actual() IS NULL THEN
RAISE EXCEPTION 'no_autorizado' USING ERRCODE = '42501';
END IF;

IF p_metodo_pago NOT IN ('efectivo', 'tarjeta', 'transferencia') THEN
RAISE EXCEPTION 'metodo_invalido';
END IF;

IF jsonb_typeof(p_lineas) IS DISTINCT FROM 'array' OR jsonb_array_length(p_lineas) = 0 THEN
RAISE EXCEPTION 'venta_vacia';
END IF;

v_folio := 'V-' || nextval('ventas_folio_seq');

INSERT INTO ventas (folio, usuario_id, total, metodo_pago)
VALUES (v_folio, v_usuario, 0, p_metodo_pago)
RETURNING id INTO v_venta_id;

FOR v_linea IN SELECT value FROM jsonb_array_elements(p_lineas) LOOP
v_cantidad := (v_linea->>'cantidad')::integer;
IF v_cantidad IS NULL OR v_cantidad < 1 OR v_cantidad > 999 THEN
RAISE EXCEPTION 'cantidad_invalida';
END IF;

SELECT * INTO v_articulo
FROM articulos
WHERE id = (v_linea->>'articuloId')::uuid
FOR UPDATE;

IF NOT FOUND THEN
RAISE EXCEPTION 'articulo_no_existe';
END IF;

IF NOT v_articulo.activo THEN
RAISE EXCEPTION 'articulo_pausado:%', v_articulo.codigo;
END IF;

IF v_articulo.existencias < v_cantidad THEN
RAISE EXCEPTION 'sin_existencias:%', v_articulo.codigo;
END IF;

UPDATE articulos
SET existencias = existencias - v_cantidad
WHERE id = v_articulo.id;

v_subtotal := v_articulo.precio * v_cantidad;
v_total := v_total + v_subtotal;

INSERT INTO detalle_venta (
venta_id, articulo_id, descripcion, talla, cantidad, precio_unitario, subtotal
) VALUES (
v_venta_id, v_articulo.id, v_articulo.descripcion, v_articulo.talla,
v_cantidad, v_articulo.precio, v_subtotal
);
END LOOP;

UPDATE ventas SET total = v_total WHERE id = v_venta_id;

RETURN jsonb_build_object('id', v_venta_id, 'folio', v_folio, 'total', v_total);
END;
$function$;
