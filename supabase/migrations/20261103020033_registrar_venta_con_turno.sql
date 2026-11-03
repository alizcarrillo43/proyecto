/*
# Ventas ligadas al turno de caja

## Plain-English summary
Updates the sale function so that an employee can only sell while they have an open shift, and cannot sell on a day whose cut was already closed. Every sale made by an employee is saved with the shift it belongs to. The payment method and all stock and price rules stay exactly as they were.

## 1. Modified function
- `registrar_venta(p_lineas, p_metodo_pago)`:
  - Employees need an open shift (error `sin_turno_abierto`).
  - Employees cannot sell on a day already closed in their shift (error `dia_cerrado`).
  - The sale is stored with `turno_id`.
  - Superusers can still sell without a shift; their sales keep an empty `turno_id`.

## 2. Security
- The function keeps its existing SECURITY DEFINER setup and its EXECUTE grant.
- The seller is still taken from the signed-in session, not from the request.
- The employee's open shift is locked while the sale is written, so a sale and a shift close cannot race.

## 3. Important notes
1. Stock, price and method validation are unchanged.
2. Sales made before this migration have no shift and are not part of any cut.
*/

CREATE OR REPLACE FUNCTION public.registrar_venta(p_lineas jsonb, p_metodo_pago text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
v_usuario uuid := auth.uid();
v_rol text := rol_actual();
v_turno_id uuid;
v_venta_id uuid;
v_folio text;
v_total numeric(10,2) := 0;
v_linea jsonb;
v_articulo articulos%ROWTYPE;
v_cantidad integer;
v_subtotal numeric(10,2);
BEGIN
IF v_rol IS NULL THEN
RAISE EXCEPTION 'no_autorizado' USING ERRCODE = '42501';
END IF;

IF p_metodo_pago NOT IN ('efectivo', 'tarjeta', 'transferencia') THEN
RAISE EXCEPTION 'metodo_invalido';
END IF;

IF jsonb_typeof(p_lineas) IS DISTINCT FROM 'array' OR jsonb_array_length(p_lineas) = 0 THEN
RAISE EXCEPTION 'venta_vacia';
END IF;

IF v_rol = 'empleado' THEN
SELECT t.id INTO v_turno_id
FROM turnos t
WHERE t.empleado_id = v_usuario AND t.estado = 'abierto'
FOR UPDATE;

IF v_turno_id IS NULL THEN
RAISE EXCEPTION 'sin_turno_abierto';
END IF;

IF EXISTS (
SELECT 1 FROM cortes_diarios c
WHERE c.turno_id = v_turno_id AND c.fecha = fecha_mexico(now())
) THEN
RAISE EXCEPTION 'dia_cerrado';
END IF;
END IF;

v_folio := 'V-' || nextval('ventas_folio_seq');

INSERT INTO ventas (folio, usuario_id, total, metodo_pago, turno_id)
VALUES (v_folio, v_usuario, 0, p_metodo_pago, v_turno_id)
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

CREATE INDEX IF NOT EXISTS ventas_turno_fecha_idx ON ventas (turno_id, created_at);
