'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { NuevoEmpleadoDialog } from '@/components/empleados/nuevo-empleado-dialog';
import { RestablecerContrasenaDialog } from '@/components/empleados/restablecer-contrasena-dialog';
import { TablaEmpleados } from '@/components/empleados/tabla-empleados';
import { SoloSuperusuario } from '@/components/solo-superusuario';
import { Button } from '@/components/ui/button';
import { useEmpleados } from '@/hooks/use-empleados';
import type { Empleado } from '@/lib/types';

export default function EmpleadosPage() {
  return (
    <SoloSuperusuario>
      <EmpleadosContenido />
    </SoloSuperusuario>
  );
}

function EmpleadosContenido() {
  const { empleados, cargando, error, recargar } = useEmpleados();
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [empleadoARestablecer, setEmpleadoARestablecer] = useState<Empleado | null>(null);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-night">Empleados</h1>
          <p className="mt-1 text-brand-grape">Altas, accesos y contraseñas del equipo.</p>
        </div>
        <Button
          type="button"
          size="lg"
          onClick={() => setNuevoAbierto(true)}
          className="gap-2 bg-brand-plum text-white hover:bg-brand-grape"
        >
          <Plus className="h-5 w-5" aria-hidden />
          Nuevo empleado
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
        <p className="py-16 text-center text-brand-grape">Cargando empleados...</p>
      ) : empleados.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-brand-mauve bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-brand-night">Aún no hay empleados</p>
          <p className="mt-1 text-brand-grape">Da de alta a tu primer empleado para que pueda vender.</p>
        </div>
      ) : (
        <TablaEmpleados
          empleados={empleados}
          onRestablecer={setEmpleadoARestablecer}
          onCambiado={() => void recargar()}
        />
      )}

      <NuevoEmpleadoDialog
        open={nuevoAbierto}
        onOpenChange={setNuevoAbierto}
        onCreado={() => void recargar()}
      />
      <RestablecerContrasenaDialog
        empleado={empleadoARestablecer}
        onOpenChange={(abierto) => {
          if (!abierto) setEmpleadoARestablecer(null);
        }}
      />
    </div>
  );
}
