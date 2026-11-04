import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMXN } from '@/lib/format';
import type { LineaVenta } from '@/lib/types';

export function SaleTable({
  lineas,
  onCambiarCantidad,
  onQuitar,
}: {
  lineas: LineaVenta[];
  onCambiarCantidad: (articuloId: string, cambio: number) => void;
  onQuitar: (articuloId: string) => void;
}) {
  if (lineas.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-brand-mauve bg-white px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-lilac text-brand-night">
          <ShoppingBag className="h-7 w-7" aria-hidden />
        </div>
        <p className="text-lg font-semibold text-brand-night">La venta está vacía</p>
        <p className="mt-1 max-w-sm text-brand-grape">
          Escanea un código de barras o elige un artículo para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-brand-lilac">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-brand-lilac hover:bg-brand-lilac">
            <TableRow className="border-brand-mauve/40 hover:bg-transparent">
              <TableHead className="h-12 px-4 text-brand-night">Descripción</TableHead>
              <TableHead className="h-12 px-4 text-center text-brand-night">Color</TableHead>
              <TableHead className="h-12 px-4 text-center text-brand-night">Número</TableHead>
              <TableHead className="h-12 px-4 text-right text-brand-night">Precio unitario</TableHead>
              <TableHead className="h-12 px-4 text-center text-brand-night">Cantidad (pz)</TableHead>
              <TableHead className="h-12 px-4 text-right text-brand-night">Importe</TableHead>
              <TableHead className="h-12 w-16 px-4">
                <span className="sr-only">Quitar</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineas.map((linea) => (
              <TableRow key={linea.articuloId} className="border-brand-lilac/60">
                <TableCell className="px-4 py-4 text-base font-medium text-brand-night">
                  {linea.descripcion}
                  <span className="block text-sm font-normal text-brand-grape tabular-nums">
                    {linea.codigo}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-4 text-center text-base text-brand-grape">
                  {linea.color || '—'}
                </TableCell>
                <TableCell className="px-4 py-4 text-center text-base tabular-nums">
                  {linea.talla}
                </TableCell>
                <TableCell className="px-4 py-4 text-right text-base tabular-nums">
                  {formatMXN(linea.precio)}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onCambiarCantidad(linea.articuloId, -1)}
                      disabled={linea.cantidad <= 1}
                      aria-label={`Disminuir cantidad de ${linea.descripcion}`}
                      className="h-10 w-10 border-brand-plum text-brand-plum hover:bg-brand-lilac/40"
                    >
                      <Minus className="h-4 w-4" aria-hidden />
                    </Button>
                    <span className="w-10 text-center text-lg font-semibold tabular-nums text-brand-night">
                      {linea.cantidad}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onCambiarCantidad(linea.articuloId, 1)}
                      aria-label={`Aumentar cantidad de ${linea.descripcion}`}
                      className="h-10 w-10 border-brand-plum text-brand-plum hover:bg-brand-lilac/40"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 text-right text-base font-semibold tabular-nums text-brand-night">
                  {formatMXN(linea.precio * linea.cantidad)}
                </TableCell>
                <TableCell className="px-4 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onQuitar(linea.articuloId)}
                    aria-label={`Quitar ${linea.descripcion} de la venta`}
                    className="h-10 w-10 text-danger hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
