'use client';

import Link from 'next/link';
import { AlertTriangle, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EstadoTurnoAbierto } from '@/hooks/use-turno-abierto';

export function TurnoRequeridoAviso({
  estado,
  onReintentar,
}: {
  estado: Exclude<EstadoTurnoAbierto, 'abierto'>;
  onReintentar: () => void;
}) {
  if (estado === 'cargando') {
    return (
      <div className="mx-auto max-w-md p-6 text-center text-sm font-medium text-brand-grape" role="status">
        Revisando tu turno...
      </div>
    );
  }

  const error = estado === 'error';
  const Icono = error ? AlertTriangle : Lock;

  return (
    <section className="mx-auto mt-10 max-w-lg rounded-3xl border border-brand-lilac bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-lavender text-brand-night">
        <Icono className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="mt-5 text-2xl font-bold text-brand-night">
        {error ? 'No pudimos revisar tu turno' : 'Necesitas un turno abierto para vender'}
      </h2>
      <p className="mt-2 text-brand-grape">
        {error
          ? 'Revisa tu conexión e intenta de nuevo.'
          : 'Pide al encargado que abra tu turno con tu fondo inicial. Mientras tanto no puedes cobrar.'}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        {error ? (
          <Button onClick={onReintentar} className="h-12 bg-brand-plum text-white hover:bg-brand-grape">
            Reintentar
          </Button>
        ) : (
          <Button asChild variant="outline" className="h-12 border-brand-plum text-brand-plum hover:bg-brand-lilac/40">
            <Link href="/turno">
              <Clock className="mr-2 h-4 w-4" aria-hidden />
              Ver mi turno
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}
