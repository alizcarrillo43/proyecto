import { supabase } from '@/lib/supabase';

export type CajaDelDia = { monto: number; actualizadoEn: string };

export type ResultadoCaja = { ok: true; caja: CajaDelDia } | { ok: false; error: string };

const MENSAJE_CARGA = 'No pudimos cargar la caja inicial. Intenta de nuevo.';
const MENSAJE_GUARDADO = 'No pudimos guardar la caja inicial. Intenta de nuevo.';

export function fechaDeHoy(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());
}

export async function cargarCajaDeHoy(): Promise<{ ok: true; caja: CajaDelDia | null } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('caja_inicial')
    .select('monto, updated_at')
    .eq('fecha', fechaDeHoy())
    .maybeSingle();
  if (error) return { ok: false, error: MENSAJE_CARGA };
  if (!data) return { ok: true, caja: null };
  return {
    ok: true,
    caja: { monto: Number(data.monto), actualizadoEn: String(data.updated_at) },
  };
}

export async function guardarCajaDeHoy(monto: number): Promise<ResultadoCaja> {
  const fecha = fechaDeHoy();
  const { data: existente, error: errorBusqueda } = await supabase
    .from('caja_inicial')
    .select('id')
    .eq('fecha', fecha)
    .maybeSingle();
  if (errorBusqueda) return { ok: false, error: MENSAJE_GUARDADO };

  const consulta = existente
    ? supabase
        .from('caja_inicial')
        .update({ monto, updated_at: new Date().toISOString() })
        .eq('id', existente.id)
    : supabase.from('caja_inicial').insert({ fecha, monto });
  const { data, error } = await consulta.select('monto, updated_at').maybeSingle();

  if (error) {
    if (error.code === '42501') {
      return { ok: false, error: 'Solo el superusuario puede registrar la caja inicial.' };
    }
    return { ok: false, error: MENSAJE_GUARDADO };
  }
  if (!data) return { ok: false, error: MENSAJE_GUARDADO };
  return {
    ok: true,
    caja: { monto: Number(data.monto), actualizadoEn: String(data.updated_at) },
  };
}
