'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ResumenDia } from '@/lib/historial-api';
import { formatMXN } from '@/lib/format';
import type { LineaHistorial } from '@/lib/types';

const formatoHora = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  hour: '2-digit',
  minute: '2-digit',
});

type FilaDia = { linea: LineaHistorial; importe: number; acumulado: number };

function calcularFilas(lineas: LineaHistorial[]): FilaDia[] {
  const filas: FilaDia[] = [];
  let acumulado = 0;
  for (const linea of lineas) {
    const importe = linea.precioUnitario * linea.cantidad;
    acumulado = Math.round((acumulado + importe) * 100) / 100;
    filas.push({ linea, importe, acumulado });
  }
  return filas;
}

export function DiaVentasDialog({
  dia,
  onOpenChange,
}: {
  dia: ResumenDia | null;
  onOpenChange: (open: boolean) => void;
}) {
  const filas = dia ? calcularFilas(dia.lineas) : [];

  return (
    <Dialog open={dia !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col rounded-3xl border-brand-lilac bg-white p-0 sm:max-w-4xl">
        {dia && (
          <>
            <DialogHeader className="border-b border-brand-lilac p-6 pb-4 sm:p-8 sm:pb-4">
              <DialogTitle className="text-2xl font-bold capitalize text-brand-night">{dia.etiqueta}</DialogTitle>
              <DialogDescription className="text-brand-grape">
                {dia.ventas} {dia.ventas === 1 ? 'venta' : 'ventas'} · {dia.piezas} {dia.piezas === 1 ? 'pieza' : 'piezas'} · Total vendido{' '}
                <span className="font-semibold text-brand-night tabular-nums">{formatMXN(dia.total)}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-brand-lilac hover:bg-brand-lilac">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-12 px-4 text-brand-night">Hora</TableHead>
                    <TableHead className="h-12 px-4 text-brand-night">Folio</TableHead>
                    <TableHead className="h-12 px-4 text-brand-night">Artículo</TableHead>
                    <TableHead className="h-12 px-4 text-center text-brand-night">Talla</TableHead>
                    <TableHead className="h-12 px-4 text-center text-brand-night">Cant.</TableHead>
                    <TableHead className="h-12 px-4 text-right text-brand-night">Importe</TableHead>
                    <TableHead className="h-12 px-4 text-right text-brand-night">Acumulado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map(({ linea, importe, acumulado }, indice) => (
                    <TableRow key={`${linea.id}-${indice}`} className="border-brand-lilac/60">
                      <TableCell className="px-4 py-3 tabular-nums text-brand-grape">
                        {formatoHora.format(new Date(linea.fecha))}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-semibold tabular-nums text-brand-night">{linea.folio}</TableCell>
                      <TableCell className="px-4 py-3 font-medium text-brand-night">
                        {linea.descripcion}
                        <span className="block text-sm font-normal text-brand-grape">{formatMXN(linea.precioUnitario)} c/u</span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center tabular-nums">{linea.talla}</TableCell>
                      <TableCell className="px-4 py-3 text-center tabular-nums">{linea.cantidad}</TableCell>
                      <TableCell className="px-4 py-3 text-right font-semibold tabular-nums text-brand-night">
                        {formatMXN(importe)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums text-brand-grape">
                        {formatMXN(acumulado)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between border-t border-brand-lilac bg-brand-mist/60 px-6 py-4 sm:px-8">
              <span className="font-semibold text-brand-night">Total del día</span>
              <span className="text-2xl font-bold tabular-nums text-brand-night">{formatMXN(dia.total)}</span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
