'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSesion } from '@/components/session-provider';
import { TurnoEmpleadoView } from '@/components/turnos/turno-empleado-view';

export default function TurnoPage() {
  const { perfil } = useSesion();

  if (perfil?.rol === 'superusuario') {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center lg:p-10">
        <h1 className="text-2xl font-bold text-brand-night">Gestión de turnos</h1>
        <p className="mt-2 text-brand-grape">Administra los turnos de tu equipo desde el panel de gestión.</p>
        <Button asChild className="mt-6 bg-brand-plum text-white hover:bg-brand-grape">
          <Link href="/gestion-turnos">
            Abrir gestión de turnos
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    );
  }

  return <TurnoEmpleadoView />;
}
