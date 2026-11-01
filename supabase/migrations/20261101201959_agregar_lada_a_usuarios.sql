/*
# Agregar lada (código de país) a usuarios

## Resumen
Cada usuario guarda ahora la lada de su teléfono en un campo separado, para que
el número completo (lada + teléfono) se pueda usar al enviar códigos por SMS.

## 1. Tablas modificadas
- `usuarios`: nueva columna `lada` (texto, por defecto '+52'). Formato: signo + 1 a 4 dígitos.
  Las filas existentes reciben '+52' automáticamente. No se modifican ni eliminan datos.

## 2. Seguridad
- Sin cambios en RLS, políticas ni permisos.

## 3. Notas importantes
1. Esta migración es repetible: usa IF NOT EXISTS.
2. La columna `telefono` sigue guardando solo los 10 dígitos.
*/

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS lada text NOT NULL DEFAULT '+52';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_lada_formato'
  ) THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_lada_formato CHECK (lada ~ '^\+[0-9]{1,4}$');
  END IF;
END $$;
