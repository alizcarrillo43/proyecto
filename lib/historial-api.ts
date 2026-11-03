import { supabase } from '@/lib/supabase';
import type { LineaHistorial } from '@/lib/types';

export type ResumenDia = {
  clave: string;
  etiqueta: string;
  lineas: LineaHistorial[];
  ventas: number;
  piezas: number;
  total: number;
};

const ZONA_VENTAS = 'America/Mexico_City';
const formatoClaveDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_VENTAS,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const formatoEtiquetaDia = new Intl.DateTimeFormat('es-MX', {
  timeZone: ZONA_VENTAS,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function agruparPorDia(lineas: LineaHistorial[]): ResumenDia[] {
  const porDia = new Map<string, LineaHistorial[]>();
  for (const linea of lineas) {
    const clave = formatoClaveDia.format(new Date(linea.fecha));
    const grupo = porDia.get(clave);
    if (grupo) grupo.push(linea);
    else porDia.set(clave, [linea]);
  }

  return Array.from(porDia, ([clave, grupo]) => {
    const cronologicas = [...grupo].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );
    const total = cronologicas.reduce((suma, linea) => suma + linea.precioUnitario * linea.cantidad, 0);
    return {
      clave,
      etiqueta: formatoEtiquetaDia.format(new Date(cronologicas[0].fecha)),
      lineas: cronologicas,
      ventas: new Set(cronologicas.map((linea) => linea.folio)).size,
      piezas: cronologicas.reduce((suma, linea) => suma + linea.cantidad, 0),
      total: Math.round(total * 100) / 100,
    };
  }).sort((a, b) => b.clave.localeCompare(a.clave));
}

type FilaHistorial = {
  id: string;
  descripcion: string;
  talla: string;
  cantidad: number;
  precio_unitario: number;
  ventas: {
    folio: string;
    created_at: string;
    usuarios: { nombre: string } | null;
  } | null;
};

export async function cargarLineasVendidas(): Promise<LineaHistorial[]> {
  const { data, error } = await supabase
    .from('detalle_venta')
    .select(
      'id, descripcion, talla, cantidad, precio_unitario, ventas!inner(folio, created_at, usuarios(nombre))',
    )
    .order('created_at', { referencedTable: 'ventas', ascending: false })
    .returns<FilaHistorial[]>();

  if (error) throw new Error('No pudimos cargar el historial. Intenta de nuevo.');

  return (data ?? [])
    .filter((fila) => fila.ventas !== null)
    .map((fila) => ({
      id: fila.id,
      folio: fila.ventas!.folio,
      fecha: fila.ventas!.created_at,
      vendedor: fila.ventas!.usuarios?.nombre ?? 'Sin nombre',
      descripcion: fila.descripcion,
      talla: fila.talla,
      cantidad: fila.cantidad,
      precioUnitario: Number(fila.precio_unitario),
    }));
}
