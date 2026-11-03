'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ComprobanteTurno } from '@/components/turnos/comprobante-turno';
import { TurnoAbiertoPanel } from '@/components/turnos/turno-abierto-panel';
import { useTurnoAbierto } from '@/hooks/use-turno-abierto';
import type { DetalleTurno } from '@/lib/turnos-api';

export function TurnoEmpleadoView() {
  const turno = useTurnoAbierto(true);
  const [ultimoCierre, setUltimoCierre] = useState<DetalleTurno | null>(null);

  function alCerrarTurno(detalle: DetalleTurno) {
    setUltimoCierre(detalle);
    void turno.recargar();
  }

  let contenido;
  if (turno.estado === 'cargando') {
    contenido = <p className="p-6 text-center text-sm font-medium text-brand-grape" role="status">Revisando tu turno...</p>;
  } else if (turno.estado === 'error') {
    contenido = (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
        <span>No pudimos revisar tu turno. Revisa tu conexión e intenta de nuevo.</span>
        <Button variant="outline" onClick={() => void turno.recargar()} className="h-9 border-danger text-danger">
          Reintentar
        </Button>
      </div>
    );
  } else if (turno.estado === 'abierto' && turno.turnoId) {
    contenido = <TurnoAbiertoPanel key={turno.turnoId} turnoId={turno.turnoId} onCerrado={alCerrarTurno} />;
  } else {
    contenido = (
      <div className="rounded-3xl border border-brand-lilac bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold text-brand-night">No tienes un turno abierto</h2>
        <p className="mt-2 text-brand-grape">Pide al encargado que abra tu turno con tu fondo inicial para empezar a vender.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6 lg:p-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-grape">Mi turno</p>
        <h1 className="mt-1 text-3xl font-bold text-brand-night">Turno de caja</h1>
      </header>
      {contenido}
      {ultimoCierre && (
        <div className="space-y-4">
          <h2 className="text-center text-xl font-bold text-brand-night">Turno cerrado</h2>
          <ComprobanteTurno detalle={ultimoCierre} />
        </div>
      )}
    </div>
  );
}
