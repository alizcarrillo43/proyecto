import { supabase } from '@/lib/supabase';
import type { Articulo, LineaVenta, ModeloArticulo } from '@/lib/types';

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
  sin_turno_abierto: 'No tienes un turno abierto. Pide al encargado que lo abra para poder vender.',
  dia_cerrado: 'El corte de hoy ya está cerrado, por eso no se pueden registrar más ventas hoy.',
};

const MENSAJE_GENERICO_VENTA = 'No pudimos guardar la venta. Intenta de nuevo.';

const COLUMNAS_ARTICULO = 'id, codigo, descripcion, talla, precio, existencias, activo, color';

export function agruparModelos(articulos: Articulo[]): ModeloArticulo[] {
  const porCodigo = new Map<string, Articulo[]>();
  for (const articulo of articulos) {
    const grupo = porCodigo.get(articulo.codigo);
    if (grupo) grupo.push(articulo);
    else porCodigo.set(articulo.codigo, [articulo]);
  }
  return Array.from(porCodigo.values()).map((grupo) => {
    const tallas = [...grupo].sort((a, b) => a.talla.localeCompare(b.talla, 'es', { numeric: true }));
    const primera = tallas[0];
    const porColor = new Map<string, Articulo[]>();
    for (const articulo of tallas) {
      const c = porColor.get(articulo.color);
      if (c) c.push(articulo);
      else porColor.set(articulo.color, [articulo]);
    }
    const colores = Array.from(porColor.entries()).map(([color, arts]) => ({
      color,
      tallas: [...arts].sort((a, b) => a.talla.localeCompare(b.talla, 'es', { numeric: true })),
    }));
    return {
      codigo: primera.codigo,
      descripcion: primera.descripcion,
      precio: primera.precio,
      pausado: tallas.some((talla) => !talla.activo),
      tallas,
      colores,
    };
  });
}

function aArticulo(fila: Record<string, unknown>): Articulo {
  return {
    id: String(fila.id),
    codigo: String(fila.codigo),
    descripcion: String(fila.descripcion),
    talla: String(fila.talla),
    precio: Number(fila.precio),
    existencias: Number(fila.existencias),
    activo: Boolean(fila.activo),
    color: String(fila.color ?? ''),
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
  codigo: string;
  descripcion: string;
  talla: string;
  precio: number;
  existencias: number;
  color?: string;
};

export type ResultadoAlta = { ok: true; articulos: Articulo[] } | { ok: false; error: string };

export async function crearArticulos(datos: DatosArticulo[]): Promise<ResultadoAlta> {
  const { data, error } = await supabase
    .from('articulos')
    .insert(datos.map(({ color, ...resto }) => ({ ...resto, color: color ?? '' })))
    .select(COLUMNAS_ARTICULO);
  if (!error && Array.isArray(data)) return { ok: true, articulos: data.map(aArticulo) };
  if (error?.code === '23505') {
    return { ok: false, error: 'Ese código ya está registrado para una numeración con ese color. Usa otro código o color.' };
  }
  return { ok: false, error: 'No pudimos guardar los artículos. Intenta de nuevo.' };
}

export type DatosEdicionArticulo = {
  descripcion: string;
  precio: number;
  existencias: number;
};

export type ResultadoEdicion = { ok: true; articulo: Articulo } | { ok: false; error: string };

async function actualizarCampos(id: string, campos: DatosEdicionArticulo): Promise<ResultadoEdicion> {
  const { data, error } = await supabase
    .from('articulos')
    .update(campos)
    .eq('id', id)
    .select(COLUMNAS_ARTICULO)
    .maybeSingle();
  if (error) return { ok: false, error: 'No pudimos guardar los cambios. Intenta de nuevo.' };
  if (!data) return { ok: false, error: 'No encontramos el artículo. Actualiza la lista e intenta de nuevo.' };
  return { ok: true, articulo: aArticulo(data) };
}

export function actualizarArticulo(id: string, datos: DatosEdicionArticulo): Promise<ResultadoEdicion> {
  return actualizarCampos(id, datos);
}

export type ResultadoOperacion = { ok: true } | { ok: false; error: string };

export async function actualizarModelo(
  codigo: string,
  descripcion: string,
  precio: number,
): Promise<ResultadoOperacion> {
  const { error } = await supabase
    .from('articulos')
    .update({ descripcion, precio })
    .eq('codigo', codigo);
  if (error) return { ok: false, error: 'No pudimos guardar los cambios. Intenta de nuevo.' };
  return { ok: true };
}

export async function actualizarColorModelo(
  codigo: string,
  colorActual: string,
  nuevoColor: string,
): Promise<ResultadoOperacion> {
  const colorTrim = nuevoColor.trim();
  if (!colorTrim) {
    return { ok: false, error: 'Escribe un color válido.' };
  }
  const { error } = await supabase
    .from('articulos')
    .update({ color: colorTrim })
    .eq('codigo', codigo)
    .eq('color', colorActual);
  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Ya existe una variante con ese color en este modelo.' };
    }
    return { ok: false, error: 'No pudimos guardar el color. Intenta de nuevo.' };
  }
  return { ok: true };
}

export async function cambiarPausaModelo(codigo: string, activo: boolean): Promise<ResultadoOperacion> {
  const { error } = await supabase.from('articulos').update({ activo }).eq('codigo', codigo);
  if (error) return { ok: false, error: 'No pudimos cambiar la venta de este artículo. Intenta de nuevo.' };
  return { ok: true };
}

export async function eliminarModelo(codigo: string): Promise<ResultadoOperacion> {
  const { error } = await supabase.from('articulos').delete().eq('codigo', codigo);
  if (error) return { ok: false, error: 'No pudimos eliminar el artículo. Intenta de nuevo.' };
  return { ok: true };
}

function mensajeDeVenta(mensaje: string, lineas: LineaVenta[]) {
  const [clave, codigo] = mensaje.split(':');
  const linea = lineas.find((item) => item.codigo === codigo);
  const nombre = linea ? linea.descripcion : 'uno de los artículos';
  if (clave === 'sin_existencias') {
    return `No hay suficientes existencias de ${nombre}. Ajusta la cantidad e intenta de nuevo.`;
  }
  if (clave === 'articulo_pausado') {
    return `${nombre} está en pausa y no se puede vender. Quítalo de la venta para continuar.`;
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
