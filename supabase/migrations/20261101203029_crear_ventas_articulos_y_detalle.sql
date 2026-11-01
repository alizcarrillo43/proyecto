/*
# Crear artículos, ventas y detalle de venta con descuento de inventario

## Resumen
Guarda los artículos de la tienda con su existencia real, y cada venta cobrada
con su folio, cajero, artículos, total y método de pago. Al cobrar, la existencia
de cada artículo baja en la misma operación; si algo no alcanza, no se guarda nada.

## 1. Tablas nuevas
- `articulos`: código, descripción, talla, precio, existencias. Incluye los 8
  artículos de ejemplo que ya usaba la tienda.
- `ventas`: un registro por cobro. Folio consecutivo (V-1049, V-1050...), cajero,
  total, método de pago (efectivo, tarjeta o transferencia) y fecha y hora.
- `detalle_venta`: cada artículo vendido dentro de una venta, con cantidad,
  precio unitario y subtotal. Guarda la descripción y el precio del momento de la
  venta, para que los cambios futuros de precio no alteren el historial.

## 2. Función de cobro
- `registrar_venta(lineas, metodo_pago)`: crea la venta, valida existencias,
  descuenta el inventario y devuelve el folio y el total. Los precios se toman
  de la base de datos, nunca del navegador.

## 3. Seguridad
- RLS activado en las tres tablas.
- `articulos`, `ventas` y `detalle_venta`: solo personas con sesión iniciada
  pueden leer. Es información compartida de la tienda, no por usuario.
- Nadie escribe directamente en las tablas; las ventas solo se guardan con
  `registrar_venta`.
- `registrar_venta` solo puede ejecutarla una persona con sesión iniciada.

## 4. Notas importantes
1. Esta migración es repetible: usa IF NOT EXISTS, ON CONFLICT y reemplaza políticas.
2. No modifica ni elimina datos existentes.
*/

CREATE TABLE IF NOT EXISTS articulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE CHECK (char_length(btrim(codigo)) BETWEEN 1 AND 50),
  descripcion text NOT NULL CHECK (char_length(btrim(descripcion)) BETWEEN 1 AND 200),
  talla text NOT NULL CHECK (char_length(btrim(talla)) BETWEEN 1 AND 10),
  precio numeric(10,2) NOT NULL CHECK (precio >= 0),
  existencias integer NOT NULL DEFAULT 0 CHECK (existencias >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE articulos ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON articulos TO authenticated;

DROP POLICY IF EXISTS "select_articulos_tienda" ON articulos;
CREATE POLICY "select_articulos_tienda" ON articulos FOR SELECT
  TO authenticated USING (true);

INSERT INTO articulos (codigo, descripcion, talla, precio, existencias) VALUES
  ('7501000100011', 'Tenis Runner Pro negro', '26', 1299, 12),
  ('7501000100028', 'Mocasín clásico café', '27', 1450, 6),
  ('7501000100035', 'Botín de piel cuero', '25', 1890, 4),
  ('7501000100042', 'Sandalia de verano blanca', '24', 495, 18),
  ('7501000100059', 'Zapato escolar negro', '22', 650, 9),
  ('7501000100066', 'Bota vaquera miel', '26', 2150, 2),
  ('7501000100073', 'Tenis urbano gris', '28', 1099, 0),
  ('7501000100080', 'Huarache tradicional', '23', 320, 15)
ON CONFLICT (codigo) DO NOTHING;

CREATE SEQUENCE IF NOT EXISTS ventas_folio_seq START WITH 1049;

CREATE TABLE IF NOT EXISTS ventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text NOT NULL UNIQUE,
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  metodo_pago text NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ventas_created_at ON ventas (created_at DESC);

CREATE TABLE IF NOT EXISTS detalle_venta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  articulo_id uuid NOT NULL REFERENCES articulos(id) ON DELETE RESTRICT,
  descripcion text NOT NULL,
  talla text NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(10,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_detalle_venta_venta ON detalle_venta (venta_id);

ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_venta ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON ventas, detalle_venta TO authenticated;

DROP POLICY IF EXISTS "select_ventas_tienda" ON ventas;
CREATE POLICY "select_ventas_tienda" ON ventas FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "select_detalle_venta_tienda" ON detalle_venta;
CREATE POLICY "select_detalle_venta_tienda" ON detalle_venta FOR SELECT
  TO authenticated USING (true);

CREATE OR REPLACE FUNCTION registrar_venta(p_lineas jsonb, p_metodo_pago text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  IF v_usuario IS NULL THEN
    RAISE EXCEPTION 'no_autenticado' USING ERRCODE = '42501';
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
$$;

REVOKE EXECUTE ON FUNCTION registrar_venta(jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION registrar_venta(jsonb, text) TO authenticated;
