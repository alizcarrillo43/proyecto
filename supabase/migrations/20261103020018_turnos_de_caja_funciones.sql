/*
# Turnos de caja: funciones del servidor

## Plain-English summary
Adds every operation of the cash-shift module as a database function. The database checks who is calling and refuses requests the caller is not allowed to make (error 42501, which reaches the app as a 403). All amounts (sales by day, payment method totals, cash to deliver, difference) are computed on the server from the sales table, never taken from the screen.

## 1. Internal helpers (not callable by the app)
- `fecha_mexico(timestamp)`: calendar day in Mexico City time.
- `_dias_del_turno(turno)`: one row per day of a shift with totals, adjustments and whether the day is closed. Closed days use their saved cut; open days are computed live.
- `_cerrar_dias_pendientes(turno, usuario, asegurar_hoy)`: saves a cut for every day with sales that has no cut yet, up to today.
- `_turno_json(turno)`: full shift detail (days, adjustments, totals, cash to deliver).

## 2. Public functions (callable by signed-in users, each checks its own permission)
- `abrir_turno`: superuser opens a shift for an employee with an opening float. One open shift per employee.
- `detalle_turno`: shift detail. Owner employee or superuser only.
- `corte_del_dia`: items sold on a day (with size and quantity), totals and payment breakdown. Owner or superuser only.
- `cerrar_dia`: owner saves today's cut (and any earlier pending days).
- `cerrar_turno`: owner closes the shift with the counted cash. Saves all pending cuts, computes the difference on the server.
- `cerrar_turno_forzado`: superuser closes an open shift with a written reason.
- `ajustar_corte`: superuser adds an adjustment to a closed day with a written reason.
- `listar_turnos`: superuser lists shifts with optional employee and date filters.

## 3. Security
- Every public function checks the caller's role first and raises 42501 when not allowed.
- Employees can act only on their own shift. Superusers can open, force-close and adjust.
- Internal helpers have EXECUTE revoked from every app-facing role.
- Shifts are locked row by row while closing so a sale and a close cannot race.

## 4. Important notes
1. Amounts reported to the app are recalculated on each call; the app never sends totals.
2. Cash to deliver = opening float + cash sales + adjustments.
3. Difference = counted cash - cash to deliver (positive means over, negative means short).
*/

CREATE OR REPLACE FUNCTION fecha_mexico(p timestamptz)
RETURNS date
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT (p AT TIME ZONE 'America/Mexico_City')::date
$$;

CREATE OR REPLACE FUNCTION _dias_del_turno(p_turno_id uuid)
RETURNS TABLE (
  dia date,
  num_ventas integer,
  piezas integer,
  total_vendido numeric,
  total_efectivo numeric,
  total_otros numeric,
  ajuste_efectivo numeric,
  cerrado boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ventas_turno AS (
    SELECT
      v.id,
      fecha_mexico(v.created_at) AS dia_venta,
      v.total,
      v.metodo_pago,
      (SELECT coalesce(sum(dv.cantidad), 0) FROM detalle_venta dv WHERE dv.venta_id = v.id) AS piezas_venta
    FROM ventas v
    WHERE v.turno_id = p_turno_id
  ),
  vivos AS (
    SELECT
      vt.dia_venta,
      count(*)::int AS num_ventas,
      coalesce(sum(vt.piezas_venta), 0)::int AS piezas,
      coalesce(sum(vt.total), 0) AS total_vendido,
      coalesce(sum(vt.total) FILTER (WHERE vt.metodo_pago = 'efectivo'), 0) AS total_efectivo,
      coalesce(sum(vt.total) FILTER (WHERE vt.metodo_pago <> 'efectivo'), 0) AS total_otros
    FROM ventas_turno vt
    GROUP BY vt.dia_venta
  )
  SELECT
    coalesce(c.fecha, vv.dia_venta) AS dia,
    coalesce(c.num_ventas, vv.num_ventas, 0) AS num_ventas,
    coalesce(c.piezas, vv.piezas, 0) AS piezas,
    coalesce(c.total_vendido, vv.total_vendido, 0) AS total_vendido,
    coalesce(c.total_efectivo, vv.total_efectivo, 0) AS total_efectivo,
    coalesce(c.total_otros, vv.total_otros, 0) AS total_otros,
    coalesce(aj.monto_total, 0) AS ajuste_efectivo,
    (c.id IS NOT NULL) AS cerrado
  FROM vivos vv
  FULL JOIN cortes_diarios c ON c.turno_id = p_turno_id AND c.fecha = vv.dia_venta
  LEFT JOIN LATERAL (
    SELECT sum(a.monto) AS monto_total FROM ajustes_corte a WHERE a.corte_id = c.id
  ) aj ON true
  ORDER BY 1
$$;

CREATE OR REPLACE FUNCTION _cerrar_dias_pendientes(p_turno_id uuid, p_usuario uuid, p_asegurar_hoy boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hoy date := fecha_mexico(now());
BEGIN
  INSERT INTO cortes_diarios (turno_id, fecha, num_ventas, piezas, total_vendido, total_efectivo, total_otros, cerrado, cerrado_por)
  SELECT
    p_turno_id,
    a.dia,
    a.num_ventas,
    a.piezas,
    a.total_vendido,
    a.total_efectivo,
    a.total_otros,
    true,
    p_usuario
  FROM (
    SELECT
      vt.dia_venta AS dia,
      count(*)::int AS num_ventas,
      coalesce(sum(vt.piezas_venta), 0)::int AS piezas,
      coalesce(sum(vt.total), 0) AS total_vendido,
      coalesce(sum(vt.total) FILTER (WHERE vt.metodo_pago = 'efectivo'), 0) AS total_efectivo,
      coalesce(sum(vt.total) FILTER (WHERE vt.metodo_pago <> 'efectivo'), 0) AS total_otros
    FROM (
      SELECT
        fecha_mexico(v.created_at) AS dia_venta,
        v.total,
        v.metodo_pago,
        (SELECT coalesce(sum(dv.cantidad), 0) FROM detalle_venta dv WHERE dv.venta_id = v.id) AS piezas_venta
      FROM ventas v
      WHERE v.turno_id = p_turno_id
    ) vt
    GROUP BY vt.dia_venta
  ) a
  WHERE a.dia <= v_hoy
    AND NOT EXISTS (
      SELECT 1 FROM cortes_diarios c WHERE c.turno_id = p_turno_id AND c.fecha = a.dia
    );

  IF p_asegurar_hoy AND NOT EXISTS (
    SELECT 1 FROM cortes_diarios c WHERE c.turno_id = p_turno_id AND c.fecha = v_hoy
  ) THEN
    INSERT INTO cortes_diarios (turno_id, fecha, cerrado, cerrado_por)
    VALUES (p_turno_id, v_hoy, true, p_usuario);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION _turno_json(p_turno_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_turno turnos%ROWTYPE;
  v_nombre_empleado text;
  v_dias jsonb;
  v_ajustes jsonb;
  v_dias_trabajados integer;
  v_num_ventas integer;
  v_piezas integer;
  v_total numeric;
  v_efectivo numeric;
  v_tarjeta numeric;
  v_transferencia numeric;
  v_ajuste numeric;
BEGIN
  SELECT * INTO v_turno FROM turnos WHERE id = p_turno_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'turno_no_existe';
  END IF;

  SELECT nombre INTO v_nombre_empleado FROM usuarios WHERE id = v_turno.empleado_id;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'fecha', d.dia,
    'num_ventas', d.num_ventas,
    'piezas', d.piezas,
    'total_vendido', d.total_vendido,
    'total_efectivo', d.total_efectivo,
    'total_otros', d.total_otros,
    'ajuste_efectivo', d.ajuste_efectivo,
    'cerrado', d.cerrado
  ) ORDER BY d.dia), '[]'::jsonb)
  INTO v_dias
  FROM _dias_del_turno(p_turno_id) d;

  SELECT count(*)::int, coalesce(sum(d.ajuste_efectivo), 0)
  INTO v_dias_trabajados, v_ajuste
  FROM _dias_del_turno(p_turno_id) d;

  SELECT
    count(*)::int,
    coalesce(sum(v.total), 0),
    coalesce(sum(v.total) FILTER (WHERE v.metodo_pago = 'efectivo'), 0),
    coalesce(sum(v.total) FILTER (WHERE v.metodo_pago = 'tarjeta'), 0),
    coalesce(sum(v.total) FILTER (WHERE v.metodo_pago = 'transferencia'), 0),
    coalesce(sum((SELECT coalesce(sum(dv.cantidad), 0) FROM detalle_venta dv WHERE dv.venta_id = v.id)), 0)::int
  INTO v_num_ventas, v_total, v_efectivo, v_tarjeta, v_transferencia, v_piezas
  FROM ventas v
  WHERE v.turno_id = p_turno_id;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id,
    'corte_id', a.corte_id,
    'fecha', c.fecha,
    'monto', a.monto,
    'motivo', a.motivo,
    'realizado_por', u.nombre,
    'created_at', a.created_at
  ) ORDER BY a.created_at), '[]'::jsonb)
  INTO v_ajustes
  FROM ajustes_corte a
  JOIN cortes_diarios c ON c.id = a.corte_id
  JOIN usuarios u ON u.id = a.realizado_por
  WHERE c.turno_id = p_turno_id;

  RETURN jsonb_build_object(
    'turno', jsonb_build_object(
      'id', v_turno.id,
      'empleado_id', v_turno.empleado_id,
      'empleado_nombre', v_nombre_empleado,
      'estado', v_turno.estado,
      'fecha_apertura', v_turno.fecha_apertura,
      'fecha_cierre', v_turno.fecha_cierre,
      'fondo_inicial', v_turno.fondo_inicial,
      'efectivo_contado', v_turno.efectivo_contado,
      'diferencia', v_turno.diferencia,
      'cierre_forzado', v_turno.cierre_forzado,
      'motivo_cierre_forzado', v_turno.motivo_cierre_forzado
    ),
    'dias', v_dias,
    'ajustes', v_ajustes,
    'totales', jsonb_build_object(
      'dias_trabajados', v_dias_trabajados,
      'num_ventas', v_num_ventas,
      'piezas', v_piezas,
      'total_vendido', v_total,
      'total_efectivo', v_efectivo,
      'total_tarjeta', v_tarjeta,
      'total_transferencia', v_transferencia,
      'ajuste_efectivo', v_ajuste,
      'efectivo_a_entregar', v_turno.fondo_inicial + v_efectivo + v_ajuste
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION abrir_turno(p_empleado_id uuid, p_fondo_inicial numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rol text;
  v_activo boolean;
  v_turno_id uuid;
BEGIN
  IF rol_actual() IS DISTINCT FROM 'superusuario' THEN
    RAISE EXCEPTION 'no_autorizado' USING ERRCODE = '42501';
  END IF;

  SELECT u.rol, u.activo INTO v_rol, v_activo FROM usuarios u WHERE u.id = p_empleado_id;
  IF NOT FOUND OR v_rol <> 'empleado' OR v_activo IS NOT TRUE THEN
    RAISE EXCEPTION 'empleado_invalido';
  END IF;

  IF p_fondo_inicial IS NULL OR p_fondo_inicial < 0 OR p_fondo_inicial > 9999999.99 THEN
    RAISE EXCEPTION 'fondo_invalido';
  END IF;

  IF EXISTS (SELECT 1 FROM turnos WHERE empleado_id = p_empleado_id AND estado = 'abierto') THEN
    RAISE EXCEPTION 'turno_ya_abierto';
  END IF;

  INSERT INTO turnos (empleado_id, abierto_por, fondo_inicial)
  VALUES (p_empleado_id, auth.uid(), round(p_fondo_inicial, 2))
  RETURNING id INTO v_turno_id;

  RETURN _turno_json(v_turno_id);
END;
$$;

CREATE OR REPLACE FUNCTION detalle_turno(p_turno_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF rol_actual() IS NULL OR (
    rol_actual() <> 'superusuario'
    AND NOT EXISTS (SELECT 1 FROM turnos t WHERE t.id = p_turno_id AND t.empleado_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'no_autorizado' USING ERRCODE = '42501';
  END IF;

  RETURN _turno_json(p_turno_id);
END;
$$;

CREATE OR REPLACE FUNCTION corte_del_dia(p_turno_id uuid, p_fecha date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_articulos jsonb;
  v_num_ventas integer;
  v_total numeric;
  v_efectivo numeric;
  v_tarjeta numeric;
  v_transferencia numeric;
  v_piezas integer;
  v_cerrado boolean;
  v_ajuste numeric;
BEGIN
  IF rol_actual() IS NULL OR (
    rol_actual() <> 'superusuario'
    AND NOT EXISTS (SELECT 1 FROM turnos t WHERE t.id = p_turno_id AND t.empleado_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'no_autorizado' USING ERRCODE = '42501';
  END IF;

  IF p_fecha IS NULL THEN
    RAISE EXCEPTION 'fecha_invalida';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'descripcion', x.descripcion,
    'talla', x.talla,
    'cantidad', x.cantidad,
    'importe', x.importe
  ) ORDER BY x.descripcion, x.talla), '[]'::jsonb)
  INTO v_articulos
  FROM (
    SELECT dv.descripcion, dv.talla, sum(dv.cantidad)::int AS cantidad, sum(dv.subtotal) AS importe
    FROM detalle_venta dv
    JOIN ventas v ON v.id = dv.venta_id
    WHERE v.turno_id = p_turno_id AND fecha_mexico(v.created_at) = p_fecha
    GROUP BY dv.descripcion, dv.talla
  ) x;

  SELECT
    count(*)::int,
    coalesce(sum(v.total), 0),
    coalesce(sum(v.total) FILTER (WHERE v.metodo_pago = 'efectivo'), 0),
    coalesce(sum(v.total) FILTER (WHERE v.metodo_pago = 'tarjeta'), 0),
    coalesce(sum(v.total) FILTER (WHERE v.metodo_pago = 'transferencia'), 0)
  INTO v_num_ventas, v_total, v_efectivo, v_tarjeta, v_transferencia
  FROM ventas v
  WHERE v.turno_id = p_turno_id AND fecha_mexico(v.created_at) = p_fecha;

  SELECT coalesce(sum(dv.cantidad), 0)::int
  INTO v_piezas
  FROM detalle_venta dv
  JOIN ventas v ON v.id = dv.venta_id
  WHERE v.turno_id = p_turno_id AND fecha_mexico(v.created_at) = p_fecha;

  SELECT c.cerrado, coalesce((SELECT sum(a.monto) FROM ajustes_corte a WHERE a.corte_id = c.id), 0)
  INTO v_cerrado, v_ajuste
  FROM cortes_diarios c
  WHERE c.turno_id = p_turno_id AND c.fecha = p_fecha;

  RETURN jsonb_build_object(
    'fecha', p_fecha,
    'cerrado', coalesce(v_cerrado, false),
    'num_ventas', v_num_ventas,
    'piezas', v_piezas,
    'total_vendido', v_total,
    'por_metodo', jsonb_build_object(
      'efectivo', v_efectivo,
      'tarjeta', v_tarjeta,
      'transferencia', v_transferencia
    ),
    'ajuste_efectivo', coalesce(v_ajuste, 0),
    'articulos', v_articulos
  );
END;
$$;

CREATE OR REPLACE FUNCTION cerrar_dia(p_turno_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estado text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM turnos t WHERE t.id = p_turno_id AND t.empleado_id = auth.uid()) THEN
    RAISE EXCEPTION 'no_autorizado' USING ERRCODE = '42501';
  END IF;

  SELECT t.estado INTO v_estado FROM turnos t WHERE t.id = p_turno_id FOR UPDATE;
  IF v_estado IS DISTINCT FROM 'abierto' THEN
    RAISE EXCEPTION 'turno_cerrado';
  END IF;

  PERFORM _cerrar_dias_pendientes(p_turno_id, auth.uid(), true);

  RETURN _turno_json(p_turno_id);
END;
$$;

CREATE OR REPLACE FUNCTION cerrar_turno(p_turno_id uuid, p_efectivo_contado numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estado text;
  v_resumen jsonb;
  v_a_entregar numeric;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM turnos t WHERE t.id = p_turno_id AND t.empleado_id = auth.uid()) THEN
    RAISE EXCEPTION 'no_autorizado' USING ERRCODE = '42501';
  END IF;

  SELECT t.estado INTO v_estado FROM turnos t WHERE t.id = p_turno_id FOR UPDATE;
  IF v_estado IS DISTINCT FROM 'abierto' THEN
    RAISE EXCEPTION 'turno_cerrado';
  END IF;

  IF p_efectivo_contado IS NULL OR p_efectivo_contado < 0 OR p_efectivo_contado > 9999999.99 THEN
    RAISE EXCEPTION 'efectivo_invalido';
  END IF;

  PERFORM _cerrar_dias_pendientes(p_turno_id, auth.uid(), false);

  v_resumen := _turno_json(p_turno_id);
  v_a_entregar := (v_resumen->'totales'->>'efectivo_a_entregar')::numeric;

  UPDATE turnos
  SET estado = 'cerrado',
      fecha_cierre = now(),
      cerrado_por = auth.uid(),
      efectivo_contado = round(p_efectivo_contado, 2),
      diferencia = round(p_efectivo_contado, 2) - v_a_entregar
  WHERE id = p_turno_id;

  RETURN _turno_json(p_turno_id);
END;
$$;

CREATE OR REPLACE FUNCTION cerrar_turno_forzado(p_turno_id uuid, p_motivo text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estado text;
BEGIN
  IF rol_actual() IS DISTINCT FROM 'superusuario' THEN
    RAISE EXCEPTION 'no_autorizado' USING ERRCODE = '42501';
  END IF;

  IF length(btrim(coalesce(p_motivo, ''))) < 10 THEN
    RAISE EXCEPTION 'motivo_requerido';
  END IF;

  SELECT t.estado INTO v_estado FROM turnos t WHERE t.id = p_turno_id FOR UPDATE;
  IF v_estado IS NULL THEN
    RAISE EXCEPTION 'turno_no_existe';
  END IF;
  IF v_estado <> 'abierto' THEN
    RAISE EXCEPTION 'turno_cerrado';
  END IF;

  PERFORM _cerrar_dias_pendientes(p_turno_id, auth.uid(), false);

  UPDATE turnos
  SET estado = 'cerrado',
      fecha_cierre = now(),
      cerrado_por = auth.uid(),
      cierre_forzado = true,
      motivo_cierre_forzado = btrim(p_motivo),
      efectivo_contado = NULL,
      diferencia = NULL
  WHERE id = p_turno_id;

  RETURN _turno_json(p_turno_id);
END;
$$;

CREATE OR REPLACE FUNCTION ajustar_corte(p_corte_id uuid, p_monto numeric, p_motivo text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_turno_id uuid;
BEGIN
  IF rol_actual() IS DISTINCT FROM 'superusuario' THEN
    RAISE EXCEPTION 'no_autorizado' USING ERRCODE = '42501';
  END IF;

  IF p_monto IS NULL OR p_monto = 0 OR abs(p_monto) > 999999.99 THEN
    RAISE EXCEPTION 'monto_invalido';
  END IF;

  IF length(btrim(coalesce(p_motivo, ''))) < 10 THEN
    RAISE EXCEPTION 'motivo_requerido';
  END IF;

  SELECT c.turno_id INTO v_turno_id FROM cortes_diarios c WHERE c.id = p_corte_id;
  IF v_turno_id IS NULL THEN
    RAISE EXCEPTION 'corte_no_existe';
  END IF;

  INSERT INTO ajustes_corte (corte_id, monto, motivo, realizado_por)
  VALUES (p_corte_id, round(p_monto, 2), btrim(p_motivo), auth.uid());

  RETURN _turno_json(v_turno_id);
END;
$$;

CREATE OR REPLACE FUNCTION listar_turnos(p_empleado_id uuid, p_desde date, p_hasta date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF rol_actual() IS DISTINCT FROM 'superusuario' THEN
    RAISE EXCEPTION 'no_autorizado' USING ERRCODE = '42501';
  END IF;

  RETURN (
    SELECT coalesce(jsonb_agg(fila ORDER BY fila->>'fecha_apertura' DESC), '[]'::jsonb)
    FROM (
      SELECT jsonb_build_object(
        'id', t.id,
        'empleado_id', t.empleado_id,
        'empleado_nombre', u.nombre,
        'estado', t.estado,
        'fecha_apertura', t.fecha_apertura,
        'fecha_cierre', t.fecha_cierre,
        'fondo_inicial', t.fondo_inicial,
        'efectivo_contado', t.efectivo_contado,
        'diferencia', t.diferencia,
        'cierre_forzado', t.cierre_forzado,
        'motivo_cierre_forzado', t.motivo_cierre_forzado,
        'total_vendido', (SELECT coalesce(sum(v.total), 0) FROM ventas v WHERE v.turno_id = t.id),
        'total_efectivo', (SELECT coalesce(sum(v.total), 0) FROM ventas v WHERE v.turno_id = t.id AND v.metodo_pago = 'efectivo'),
        'dias_trabajados', (SELECT count(DISTINCT fecha_mexico(v.created_at)) FROM ventas v WHERE v.turno_id = t.id)
      ) AS fila
      FROM turnos t
      JOIN usuarios u ON u.id = t.empleado_id
      WHERE (p_empleado_id IS NULL OR t.empleado_id = p_empleado_id)
        AND (p_desde IS NULL OR fecha_mexico(t.fecha_apertura) >= p_desde)
        AND (p_hasta IS NULL OR fecha_mexico(t.fecha_apertura) <= p_hasta)
    ) listado
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION fecha_mexico(timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION _dias_del_turno(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION _cerrar_dias_pendientes(uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION _turno_json(uuid) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION abrir_turno(uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION detalle_turno(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION corte_del_dia(uuid, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION cerrar_dia(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION cerrar_turno(uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION cerrar_turno_forzado(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION ajustar_corte(uuid, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION listar_turnos(uuid, date, date) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION abrir_turno(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION detalle_turno(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION corte_del_dia(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION cerrar_dia(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION cerrar_turno(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION cerrar_turno_forzado(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION ajustar_corte(uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION listar_turnos(uuid, date, date) TO authenticated;
