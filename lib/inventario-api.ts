import { generarCodigoEAN13 } from '@/lib/codigo-barras';
import { supabase } from '@/lib/supabase';
import type { Articulo, LineaVenta } from '@/lib/types';

export type DatosEdicionArticulo = {
  descripcion: string;
  precio: number;
  existencias: number;
};

export type ResultadoEdicion = { ok: true; articulo: Articulo } | { ok: false; error: string };

export async function actualizarArticulo(
  id: string,
  datos: DatosEdicionArticulo,
): Promise<ResultadoEdicion> {
  const { data, error } = await supabase
    .from('articulos')
    .update(datos)
    .eq('id', id)
    .select(COLUMNAS_ARTICULO)
    .maybeSingle();
  if (error) return { ok: false, error: 'No pudimos guardar los cambios. Intenta de nuevo.' };
  if (!data) return { ok: false, error: 'No encontramos el artículo. Actualiza la lista e intenta de nuevo.' };
  return { ok: true, articulo: aArticulo(data) };
}

export type ResultadoEliminacion = { ok: true } | { ok: false; error: string };

export async function eliminarArticulo(id: string): Promise<ResultadoEliminacion> {
  const { error } = await supabase.from('articulos').delete().eq('id', id);
  if (!error) return { ok: true };
  if (error.code === '23503') {
    return {
      ok: false,
      error: 'Este artículo ya tiene ventas registradas, por eso no se puede eliminar. Puedes dejar sus existencias en 0.',
    };
  }
  return { ok: false, error: 'No pudimos eliminar el artículo. Intenta de nuevo.' };
}

export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';

export type ResultadoVenta =
  | { ok: true; folio: string; total: number }
  | { ok: false; error: string };

const MENSAJES_VENTA: Record<string, string> = {
  no_autenticado: 'Tu sesión venció. Vuelve a iniciar sesión para cobrar.',
  articulo_no_existe: 'Uno de los artículos ya no está en el catálogo. Quítalo e intenta de nuevo.',
  cantidad_invalida: 'Revisa las cantidades de la venta.',
  venta_vacia: 'Agrega artículos antes de cobrar.',
  metodo_invalido: 'El método de pago no es válido.',
};

const MENSAJE_GENERICO_VENTA = 'No pudimos guardar la venta. Intenta de nuevo.';

const COLUMNAS_ARTICULO = 'id, codigo, descripcion, talla, precio, existencias';
const INTENTOS_CODIGO = 3;

function aArticulo(fila: Record<string, unknown>): Articulo {
  return {
    id: String(fila.id),
    codigo: String(fila.codigo),
    descripcion: String(fila.descripcion),
    talla: String(fila.talla),
    precio: Number(fila.precio),
    existencias: Number(fila.existencias),
  };
}

export async function cargarArticulos(): Promise<Articulo[]> {
  const { data, error } = await supabase
    .from('articulos')
    .select(COLUMNAS_ARTICULO)
    .order('descripcion');
  if (error || !Array.isArray(data)) {
    throw new Error('No pudimos cargar los artículos. Revisa tu conexión e intenta de nuevo.');
  }
  return data.map(aArticulo);
}

export type DatosArticulo = {
  descripcion: string;
  talla: string;
  precio: number;
  existencias: number;
};

export type ResultadoAlta = { ok: true; articulo: Articulo } | { ok: false; error: string };

export async function crearArticulo(datos: DatosArticulo): Promise<ResultadoAlta> {
  for (let intento = 0; intento < INTENTOS_CODIGO; intento++) {
    const { data, error } = await supabase
      .from('articulos')
      .insert({ ...datos, codigo: generarCodigoEAN13() })
      .select(COLUMNAS_ARTICULO)
      .single();
    if (!error && data) return { ok: true, articulo: aArticulo(data) };
    if (error?.code !== '23505') {
      return { ok: false, error: 'No pudimos guardar el artículo. Intenta de nuevo.' };
    }
  }
  return { ok: false, error: 'No pudimos generar un código de barras único. Intenta de nuevo.' };
}

function mensajeDeVenta(mensaje: string, lineas: LineaVenta[]) {
  if (mensaje.startsWith('sin_existencias:')) {
    const codigo = mensaje.slice('sin_existencias:'.length);
    const linea = lineas.find((item) => item.codigo === codigo);
    const nombre = linea ? linea.descripcion : 'uno de los artículos';
    return `No hay suficientes existencias de ${nombre}. Ajusta la cantidad e intenta de nuevo.`;
  }
  return MENSAJES_VENTA[mensaje] ?? MENSAJE_GENERICO_VENTA;
}

export async function registrarVenta(
  lineas: LineaVenta[],
  metodoPago: MetodoPago,
): Promise<ResultadoVenta> {
  const { data, error } = await supabase.rpc('registrar_venta', {
    p_lineas: lineas.map((linea) => ({ articuloId: linea.articuloId, cantidad: linea.cantidad })),
    p_metodo_pago: metodoPago,
  });
  if (error) return { ok: false, error: mensajeDeVenta(error.message, lineas) };

  const venta = data as { folio?: unknown; total?: unknown } | null;
  if (typeof venta?.folio !== 'string' || typeof venta.total !== 'number') {
    return { ok: false, error: MENSAJE_GENERICO_VENTA };
  }
  return { ok: true, folio: venta.folio, total: venta.total };
}
