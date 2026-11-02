/*
# Roles de acceso: superusuario y empleado

1. Cambios en usuarios
- El rol ahora es "superusuario" o "empleado" (antes "administrador" y "vendedor").
- Se agregan: activo (cuentas desactivadas no pueden operar), debe_cambiar_contrasena (contraseña temporal) y correo (dato de contacto).
- Solo puede existir un superusuario (índice único parcial).
- Si no hay superusuario, el usuario más antiguo pasa a superusuario.

2. Funciones auxiliares
- rol_actual(): devuelve el rol del usuario firmado si está activo; si no, nulo.
- hace_falta_configuracion(): indica si la base no tiene usuarios (para el asistente de primera configuración).
- completar_cambio_contrasena(): quita la marca de contraseña temporal del usuario firmado.

3. Permisos y políticas
- Se retiran permisos de escritura innecesarios para usuarios firmados y para el rol anónimo.
- Usuarios: cada uno ve su perfil; el superusuario ve todos.
- Artículos: cualquier usuario activo los ve; solo el superusuario los puede agregar.
- Ventas y detalle: el superusuario ve todas; el empleado solo las suyas.

4. Registrar venta
- Solo usuarios activos pueden vender. La lógica de inventario no cambia.

Notas
- Las altas, bajas, reactivaciones y contraseñas se gestionan con funciones del servidor que usan la clave de servicio.
*/

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
UPDATE usuarios SET rol = 'empleado' WHERE rol = 'vendedor';
UPDATE usuarios SET rol = 'superusuario' WHERE rol = 'administrador';
ALTER TABLE usuarios ALTER COLUMN rol SET DEFAULT 'empleado';

UPDATE usuarios SET rol = 'superusuario'
WHERE id = (SELECT id FROM usuarios ORDER BY created_at, id LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM usuarios WHERE rol = 'superusuario');

ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('superusuario', 'empleado'));

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS debe_cambiar_contrasena boolean NOT NULL DEFAULT false;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS correo text;

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_correo_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_correo_check
  CHECK (correo IS NULL OR correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_un_superusuario
  ON usuarios (rol) WHERE rol = 'superusuario';

CREATE OR REPLACE FUNCTION public.rol_actual()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT u.rol FROM usuarios u WHERE u.id = auth.uid() AND u.activo = true
$$;

CREATE OR REPLACE FUNCTION public.hace_falta_configuracion()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM usuarios)
$$;

CREATE OR REPLACE FUNCTION public.completar_cambio_contrasena()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE usuarios SET debe_cambiar_contrasena = false
  WHERE id = auth.uid() AND activo = true
$$;

REVOKE EXECUTE ON FUNCTION public.rol_actual() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rol_actual() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.hace_falta_configuracion() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hace_falta_configuracion() TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.completar_cambio_contrasena() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.completar_cambio_contrasena() TO authenticated;

REVOKE ALL ON usuarios, articulos, ventas, detalle_venta FROM anon, authenticated;
GRANT SELECT ON usuarios, articulos, ventas, detalle_venta TO authenticated;
GRANT INSERT ON articulos TO authenticated;

DROP POLICY IF EXISTS "select_own_usuario" ON usuarios;
CREATE POLICY "select_own_usuario" ON usuarios FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "select_usuarios_superusuario" ON usuarios;
CREATE POLICY "select_usuarios_superusuario" ON usuarios FOR SELECT
  TO authenticated USING (rol_actual() = 'superusuario');

DROP POLICY IF EXISTS "select_articulos_tienda" ON articulos;
CREATE POLICY "select_articulos_usuarios_activos" ON articulos FOR SELECT
  TO authenticated USING (rol_actual() IS NOT NULL);

DROP POLICY IF EXISTS "insert_articulos_tienda" ON articulos;
CREATE POLICY "insert_articulos_superusuario" ON articulos FOR INSERT
  TO authenticated WITH CHECK (rol_actual() = 'superusuario');

DROP POLICY IF EXISTS "select_ventas_tienda" ON ventas;
CREATE POLICY "select_ventas_propias_o_superusuario" ON ventas FOR SELECT
  TO authenticated
  USING (rol_actual() = 'superusuario' OR (rol_actual() IS NOT NULL AND usuario_id = auth.uid()));

DROP POLICY IF EXISTS "select_detalle_venta_tienda" ON detalle_venta;
CREATE POLICY "select_detalle_de_ventas_visibles" ON detalle_venta FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM ventas v WHERE v.id = detalle_venta.venta_id));

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
-- Solo usuarios activos (superusuario o empleado) pueden vender
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

REVOKE EXECUTE ON FUNCTION public.registrar_venta(jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_venta(jsonb, text) TO authenticated;
