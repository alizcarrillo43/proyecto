'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Landmark, ArrowRight } from 'lucide-react';
import { useSesion } from '@/components/session-provider';
import { Button } from '@/components/ui/button';
import { cargarTurnoAbiertoId, cargarDetalleTurno, type DetalleTurno } from '@/lib/turnos-api';
import { formatMXN, formatearFechaHora } from '@/lib/format';

export function CajaInicialCard() {
  const { perfil } = useSesion();
  const [detalle, setDetalle] = useState<DetalleTurno | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const idResult = await cargarTurnoAbiertoId();
    if (!idResult.ok) {
      setError(idResult.error);
      setCargando(false);
      return;
    }
    if (!idResult.data) {
      setError(null);
      setDetalle(null);
      setCargando(false);
      return;
    }
    const detalleResult = await cargarDetalleTurno(idResult.data);
    setCargando(false);
    if (!detalleResult.ok) {
      setError(detalleResult.error);
      return;
    }
    setError(null);
    setDetalle(detalleResult.data);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const esSuperusuario = perfil?.rol === 'superusuario';

  return (
    <section
      aria-labelledby="caja-inicial-titulo"
      className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-lilac sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-lilac/60 text-brand-plum">
          <Landmark className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="caja-inicial-titulo" className="text-sm font-semibold uppercase tracking-wide text-brand-grape">
            Caja del turno
          </h2>
          {error ? (
            <p role="alert" className="text-sm font-medium text-danger">{error}</p>
          ) : cargando ? (
            <p className="text-brand-grape">Cargando...</p>
          ) : detalle ? (
            <div className="space-y-1">
              <p className="text-2xl font-bold tabular-nums text-brand-night">
                {formatMXN(detalle.turno.fondoInicial)}
                <span className="ml-2 text-sm font-medium text-brand-grape">
                  fondo inicial
                </span>
              </p>
              <p className="text-sm text-brand-grape">
                Efectivo a entregar: <span className="font-semibold tabular-nums text-brand-night">{formatMXN(detalle.totales.efectivoAEntregar)}</span>
              </p>
              <p className="text-xs text-brand-grape">
                Turno abierto desde {formatearFechaHora(detalle.turno.fechaApertura)}
              </p>
            </div>
          ) : (
            <p className="text-brand-grape">
              {esSuperusuario
                ? 'No hay un turno abierto. Abre un turno desde la gestión de turnos para registrar el fondo inicial.'
                : 'No tienes un turno abierto. Pide al encargado que abra tu turno.'}
            </p>
          )}
        </div>
      </div>

      {!cargando && !error && (
        <Button asChild variant="outline" className="h-11 border-brand-plum bg-white px-5 text-brand-plum hover:bg-brand-lilac/40 hover:text-brand-night">
          <Link href="/turno">
            {esSuperusuario ? 'Gestión de turnos' : 'Ver mi turno'}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      )}
    </section>
  );
}
