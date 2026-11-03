'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { SoloSuperusuario } from '@/components/solo-superusuario';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cargarLineasVendidas } from '@/lib/historial-api';
import { formatMXN } from '@/lib/format';
import type { LineaHistorial } from '@/lib/types';

const formatoFechaHora = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default function HistorialPage() {
  return (
    <SoloSuperusuario>
      <HistorialContenido />
    </SoloSuperusuario>
  );
}

function HistorialContenido() {
  const [lineas, setLineas] = useState<LineaHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setLineas(await cargarLineasVendidas());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-night">Historial de ventas</h1>
          <p className="mt-1 text-brand-grape">Cada artículo vendido, quién lo vendió y cuándo.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={cargando}
          onClick={() => void recargar()}
          className="gap-2 border-brand-mauve bg-white text-brand-night hover:bg-brand-lilac/40"
        >
          <RefreshCw className={cargando ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden />
          Actualizar
        </Button>
      </header>

      {error ? (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          <span>{error}</span>
          <button type="button" onClick={() => void recargar()} className="font-semibold underline underline-offset-4">
            Reintentar
          </button>
        </div>
      ) : cargando ? (
        <p className="py-16 text-center text-brand-grape">Cargando historial...</p>
      ) : lineas.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-brand-mauve bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-brand-night">Aún no hay ventas</p>
          <p className="mt-1 text-brand-grape">Cobra una venta desde la pantalla de inicio para verla aquí.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-brand-lilac">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-brand-lilac hover:bg-brand-lilac">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-12 px-4 text-brand-night">Fecha y hora</TableHead>
                  <TableHead className="h-12 px-4 text-brand-night">Folio</TableHead>
                  <TableHead className="h-12 px-4 text-brand-night">Artículo</TableHead>
                  <TableHead className="h-12 px-4 text-center text-brand-night">Talla</TableHead>
                  <TableHead className="h-12 px-4 text-center text-brand-night">Cantidad</TableHead>
                  <TableHead className="h-12 px-4 text-right text-brand-night">Precio</TableHead>
                  <TableHead className="h-12 px-4 text-brand-night">Vendedor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineas.map((linea) => (
                  <TableRow key={linea.id} className="border-brand-lilac/60">
                    <TableCell className="px-4 py-4 tabular-nums text-brand-grape">
                      {formatoFechaHora.format(new Date(linea.fecha))}
                    </TableCell>
                    <TableCell className="px-4 py-4 font-semibold text-brand-night tabular-nums">{linea.folio}</TableCell>
                    <TableCell className="px-4 py-4 font-medium text-brand-night">{linea.descripcion}</TableCell>
                    <TableCell className="px-4 py-4 text-center tabular-nums">{linea.talla}</TableCell>
                    <TableCell className="px-4 py-4 text-center tabular-nums">{linea.cantidad}</TableCell>
                    <TableCell className="px-4 py-4 text-right font-semibold tabular-nums text-brand-night">
                      {formatMXN(linea.precioUnitario)}
                    </TableCell>
                    <TableCell className="px-4 py-4">{linea.vendedor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
