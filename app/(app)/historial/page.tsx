'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { DiaVentasDialog } from '@/components/historial/dia-ventas-dialog';
import { DiasVentasList } from '@/components/historial/dias-ventas-list';
import { SoloSuperusuario } from '@/components/solo-superusuario';
import { Button } from '@/components/ui/button';
import { agruparPorDia, cargarLineasVendidas } from '@/lib/historial-api';
import type { LineaHistorial } from '@/lib/types';

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
  const [claveDiaAbierto, setClaveDiaAbierto] = useState<string | null>(null);

  const dias = useMemo(() => agruparPorDia(lineas), [lineas]);
  const diaAbierto = dias.find((dia) => dia.clave === claveDiaAbierto) ?? null;

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
          <p className="mt-1 text-brand-grape">Ventas agrupadas por día. Abre un día para ver cada artículo vendido.</p>
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
      ) : dias.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-brand-mauve bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-brand-night">Aún no hay ventas</p>
          <p className="mt-1 text-brand-grape">Cobra una venta desde la pantalla de inicio para verla aquí.</p>
        </div>
      ) : (
        <DiasVentasList dias={dias} onSeleccionar={setClaveDiaAbierto} />
      )}

      <DiaVentasDialog
        dia={diaAbierto}
        onOpenChange={(abierto) => {
          if (!abierto) setClaveDiaAbierto(null);
        }}
      />
    </div>
  );
}
