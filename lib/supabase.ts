import { createClient } from '@supabase/supabase-js';

function leerVariable(valor: string | undefined) {
  if (!valor) throw new Error('Falta la configuración de la base de datos');
  return valor;
}

const SUPABASE_URL = leerVariable(process.env.NEXT_PUBLIC_SUPABASE_URL);
const SUPABASE_ANON_KEY = leerVariable(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { SUPABASE_ANON_KEY, SUPABASE_URL };
