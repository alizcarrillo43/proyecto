import { llamarFuncion, type ResultadoAuth } from '@/lib/auth-api';
import { supabase } from '@/lib/supabase';
import type { Empleado } from '@/lib/types';

export type AccionEmpleado = 'crear' | 'activar' | 'desactivar' | 'restablecer';

type FilaEmpleado = Partial<Record<keyof Empleado, unknown>>;

function aEmpleado(fila: FilaEmpleado): Empleado | null {
  if (typeof fila.id !== 'string' || typeof fila.nombre !== 'string') return null;
  return {
    id: fila.id,
    nombre: fila.nombre,
    usuario: String(fila.usuario ?? ''),
    correo: typeof fila.correo === 'string' ? fila.correo : null,
    lada: String(fila.lada ?? ''),
    telefono: String(fila.telefono ?? ''),
    activo: fila.activo === true,
    debe_cambiar_contrasena: fila.debe_cambiar_contrasena === true,
  };
}

export async function listarEmpleados(): Promise<Empleado[]> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, usuario, correo, lada, telefono, activo, debe_cambiar_contrasena')
    .eq('rol', 'empleado')
    .order('nombre');
  if (error) throw new Error('No pudimos cargar a los empleados. Intenta de nuevo.');
  return (Array.isArray(data) ? data : [])
    .map((fila: FilaEmpleado) => aEmpleado(fila))
    .filter((empleado): empleado is Empleado => empleado !== null);
}

export async function gestionarEmpleado(
  accion: AccionEmpleado,
  cuerpo: Record<string, unknown> = {},
): Promise<ResultadoAuth> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, error: 'no_autenticado' };
  return llamarFuncion('gestion-empleados', { accion, ...cuerpo }, token);
}
