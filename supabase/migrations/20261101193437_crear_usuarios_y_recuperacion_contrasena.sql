/*
# Crear tabla de usuarios y códigos de recuperación de contraseña

## Resumen
Guarda los datos de cada persona que se registra en la tienda (nombre, teléfono,
usuario y rol) y el historial de códigos de verificación que se envían por SMS
cuando alguien olvida su contraseña.

## 1. Tablas nuevas
- `usuarios`: un registro por cuenta. Cada fila pertenece a una cuenta de inicio
  de sesión (`id` es el mismo identificador de la cuenta de acceso).
  - `nombre`, `telefono` (10 dígitos, único), `usuario` (minúsculas, único), `rol`
    (`vendedor` o `administrador`, por defecto `vendedor`), `created_at`.
- `codigos_recuperacion`: códigos de 6 dígitos para restablecer la contraseña.
  Solo se guarda una huella (hash) del código, nunca el código. Expiran y tienen un
  límite de intentos.

## 2. Seguridad
- RLS activado en ambas tablas.
- `usuarios`: cada persona con sesión iniciada solo puede leer su propia fila.
  Nadie puede escribir directamente desde la app; los registros se hacen desde
  funciones del servidor.
- `codigos_recuperacion`: sin acceso para la app (ningún rol de app tiene permisos).
  Solo las funciones del servidor, con la llave de servicio, pueden leerla y escribirla.

## 3. Notas importantes
1. Esta migración es repetible: usa IF NOT EXISTS y reemplaza las políticas.
2. No modifica ni elimina datos existentes.
*/

CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL CHECK (char_length(btrim(nombre)) BETWEEN 1 AND 100),
  telefono text NOT NULL UNIQUE CHECK (telefono ~ '^[0-9]{10}$'),
  usuario text NOT NULL UNIQUE CHECK (usuario ~ '^[a-z0-9._-]{3,30}$'),
  rol text NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('vendedor', 'administrador')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON usuarios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON usuarios TO service_role;

DROP POLICY IF EXISTS "select_own_usuario" ON usuarios;
CREATE POLICY "select_own_usuario" ON usuarios FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS codigos_recuperacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  codigo_hash text NOT NULL,
  intentos integer NOT NULL DEFAULT 0 CHECK (intentos >= 0),
  verificado boolean NOT NULL DEFAULT false,
  usado boolean NOT NULL DEFAULT false,
  expira_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_codigos_recuperacion_usuario
  ON codigos_recuperacion (usuario_id, created_at DESC);

ALTER TABLE codigos_recuperacion ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON codigos_recuperacion TO service_role;
