'use client';

import { useState } from 'react';
import { AbrirTurnoDialog } from '@/components/turnos/abrir-turno-dialog';
import { TurnoDetalleDialog } from '@/components/turnos/turno-detalle-dialog';
import { TurnosDuenoView } from '@/components/turnos/turnos-dueno-view';
import { SoloSuperusuario } from '@/components/solo-superusuario';
import type { DetalleTurno } from '@/lib/turnos-api';

export default function GestionTurnosPage() {
  const [aperturaAbierta, setAperturaAbierta] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  return (
    <SoloSuperusuario>
      <TurnosDuenoView
        key={version}
        onAbrirTurno={() => setAperturaAbierta(true)}
        onVerTurno={setTurnoSeleccionado}
      />
      <AbrirTurnoDialog
        open={aperturaAbierta}
        onOpenChange={setAperturaAbierta}
        onAbierto={(_detalle: DetalleTurno) => {
          setAperturaAbierta(false);
          setVersion((actual) => actual + 1);
        }}
      />
      <TurnoDetalleDialog
        turnoId={turnoSeleccionado}
        onOpenChange={(abierto) => {
          if (!abierto) setTurnoSeleccionado(null);
        }}
        onCambio={() => setVersion((actual) => actual + 1)}
      />
    </SoloSuperusuario>
  );
}
