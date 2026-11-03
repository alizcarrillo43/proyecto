import { supabase } from '@/lib/supabase';
import type { LineaHistorial } from '@/lib/types';

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
