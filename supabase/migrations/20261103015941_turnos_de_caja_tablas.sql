/*
# Turnos de caja: tablas base

## Plain-English summary
Adds the storage for cash shifts (turnos). A shift belongs to one employee, starts with an initial cash float, and ends with a counted-cash closing. Each worked day inside a shift is saved as a daily cut (corte). Superusers can record adjustments to a closed day, each with a written reason.

## 1. New tables
- `turnos`: one row per shift. Opening data (empleado_id, abierto_por, fecha_apertura, fondo_inicial), closing data (fecha_cierre, cerrado_por, efectivo_contado, diferencia), state (estado: abierto / cerrado), and forced-close data (cierre_forzado, motivo_cierre_forzado).
- `cortes_diarios`: one saved, read-only cut per worked day of a shift (num_ventas, piezas, total_vendido, total_efectivo, total_otros, cerrado, cerrado_por, cerrado_at).
- `ajustes_corte`: log of adjustments made to a closed day (monto, motivo, realizado_por, created_at).

## 2. Modified tables
- `ventas`: new nullable column `turno_id`. Old sales and sales made by a superuser without a shift keep it empty.

## 3. Security
- RLS enabled on all three new tables.
- Only SELECT is granted to `authenticated`. There are no INSERT/UPDATE/DELETE grants: every change goes through privileged functions that check the caller's role on the server.
- Superusers can read every shift, cut and adjustment. Employees can read only their own shifts, cuts and adjustments.
- Nothing is granted to `anon`.

## 4. Important notes
1. One open shift per employee is enforced by a partial unique index.
2. Each shift has at most one cut per calendar day (Mexico City time).
3. Cut totals must add up: efectivo + otros = total vendido.
4. A forced close must carry a written reason.
*/

CREATE TABLE IF NOT EXISTS turnos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id uuid NOT NULL REFERENCES usuarios(id),
  abierto_por uuid NOT NULL REFERENCES usuarios(id),
  fecha_apertura timestamptz NOT NULL DEFAULT now(),
  fondo_inicial numeric(12,2) NOT NULL CHECK (fondo_inicial >= 0),
  estado text NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
  fecha_cierre timestamptz,
  cerrado_por uuid REFERENCES usuarios(id),
  efectivo_contado numeric(12,2) CHECK (efectivo_contado >= 0),
  diferencia numeric(12,2),
  cierre_forzado boolean NOT NULL DEFAULT false,
  motivo_cierre_forzado text,
  CONSTRAINT turnos_estado_fecha_cierre CHECK (
    (estado = 'abierto' AND fecha_cierre IS NULL) OR (estado = 'cerrado' AND fecha_cierre IS NOT NULL)
  ),
  CONSTRAINT turnos_cierre_forzado_motivo CHECK (
    cierre_forzado = false OR length(btrim(coalesce(motivo_cierre_forzado, ''))) > 0
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS turnos_un_abierto_por_empleado
  ON turnos (empleado_id) WHERE estado = 'abierto';

CREATE INDEX IF NOT EXISTS turnos_empleado_apertura_idx
  ON turnos (empleado_id, fecha_apertura DESC);

CREATE TABLE IF NOT EXISTS cortes_diarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id uuid NOT NULL REFERENCES turnos(id) ON DELETE RESTRICT,
  fecha date NOT NULL,
  num_ventas integer NOT NULL DEFAULT 0 CHECK (num_ventas >= 0),
  piezas integer NOT NULL DEFAULT 0 CHECK (piezas >= 0),
  total_vendido numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_vendido >= 0),
  total_efectivo numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_efectivo >= 0),
  total_otros numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_otros >= 0),
  cerrado boolean NOT NULL DEFAULT true CHECK (cerrado = true),
  cerrado_por uuid NOT NULL REFERENCES usuarios(id),
  cerrado_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cortes_totales_cuadran CHECK (total_efectivo + total_otros = total_vendido),
  CONSTRAINT cortes_un_dia_por_turno UNIQUE (turno_id, fecha)
);

CREATE TABLE IF NOT EXISTS ajustes_corte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corte_id uuid NOT NULL REFERENCES cortes_diarios(id) ON DELETE RESTRICT,
  monto numeric(12,2) NOT NULL CHECK (monto <> 0 AND monto BETWEEN -999999.99 AND 999999.99),
  motivo text NOT NULL CHECK (length(btrim(motivo)) >= 10),
  realizado_por uuid NOT NULL REFERENCES usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ajustes_corte_corte_idx ON ajustes_corte (corte_id);

ALTER TABLE ventas ADD COLUMN IF NOT EXISTS turno_id uuid REFERENCES turnos(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS ventas_turno_idx ON ventas (turno_id);

ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cortes_diarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ajustes_corte ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON turnos, cortes_diarios, ajustes_corte FROM PUBLIC, anon;
GRANT SELECT ON turnos, cortes_diarios, ajustes_corte TO authenticated;

DROP POLICY IF EXISTS "select_turnos_propios_o_superusuario" ON turnos;
CREATE POLICY "select_turnos_propios_o_superusuario" ON turnos FOR SELECT
  TO authenticated
  USING (
    rol_actual() IS NOT NULL
    AND (rol_actual() = 'superusuario' OR empleado_id = auth.uid())
  );

DROP POLICY IF EXISTS "select_cortes_propios_o_superusuario" ON cortes_diarios;
CREATE POLICY "select_cortes_propios_o_superusuario" ON cortes_diarios FOR SELECT
  TO authenticated
  USING (
    rol_actual() IS NOT NULL
    AND (
      rol_actual() = 'superusuario'
      OR EXISTS (
        SELECT 1 FROM turnos t
        WHERE t.id = cortes_diarios.turno_id AND t.empleado_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "select_ajustes_propios_o_superusuario" ON ajustes_corte;
CREATE POLICY "select_ajustes_propios_o_superusuario" ON ajustes_corte FOR SELECT
  TO authenticated
  USING (
    rol_actual() IS NOT NULL
    AND (
      rol_actual() = 'superusuario'
      OR EXISTS (
        SELECT 1
        FROM cortes_diarios c
        JOIN turnos t ON t.id = c.turno_id
        WHERE c.id = ajustes_corte.corte_id AND t.empleado_id = auth.uid()
      )
    )
  );
