/*
# Caja inicial del día

1. New Tables
- `caja_inicial`: one row per calendar day with the cash on hand when the day starts.
  - `id` (uuid, primary key)
  - `fecha` (date, unique): the business day the amount belongs to.
  - `monto` (numeric 12,2, >= 0): cash counted at the start of the day.
  - `registrado_por` (uuid, references usuarios): who last set the amount; defaults to the signed-in user.
  - `created_at`, `updated_at` (timestamptz).

2. Security
- Enable RLS on `caja_inicial`.
- Any active user (employee or superuser) can read the amount.
- Only the superuser can insert or update it. No one can delete it.
- Grants are column-restricted for writes.

3. Notes
- The unique `fecha` lets the app upsert: the first save of the day creates the row, later saves update it.
*/

CREATE TABLE IF NOT EXISTS caja_inicial (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL UNIQUE,
  monto numeric(12,2) NOT NULL CHECK (monto >= 0),
  registrado_por uuid REFERENCES usuarios(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE caja_inicial ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON caja_inicial TO authenticated;
GRANT INSERT (fecha, monto, registrado_por) ON caja_inicial TO authenticated;
GRANT UPDATE (monto, registrado_por, updated_at) ON caja_inicial TO authenticated;

DROP POLICY IF EXISTS "select_caja_inicial_usuarios_activos" ON caja_inicial;
CREATE POLICY "select_caja_inicial_usuarios_activos" ON caja_inicial
  FOR SELECT TO authenticated
  USING (rol_actual() IS NOT NULL);

DROP POLICY IF EXISTS "insert_caja_inicial_superusuario" ON caja_inicial;
CREATE POLICY "insert_caja_inicial_superusuario" ON caja_inicial
  FOR INSERT TO authenticated
  WITH CHECK (rol_actual() = 'superusuario');

DROP POLICY IF EXISTS "update_caja_inicial_superusuario" ON caja_inicial;
CREATE POLICY "update_caja_inicial_superusuario" ON caja_inicial
  FOR UPDATE TO authenticated
  USING (rol_actual() = 'superusuario')
  WITH CHECK (rol_actual() = 'superusuario');
