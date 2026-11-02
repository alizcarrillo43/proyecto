'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ContrasenaTemporalVisible } from '@/components/empleados/contrasena-temporal-visible';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mensajeDeError } from '@/lib/auth-api';
import { generarContrasenaTemporal } from '@/lib/contrasena-temporal';
import { gestionarEmpleado } from '@/lib/empleados-api';
import type { Empleado } from '@/lib/types';

export function RestablecerContrasenaDialog({
  empleado,
  onOpenChange,
}: {
  empleado: Empleado | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [contrasena, setContrasena] = useState(generarContrasenaTemporal);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [restablecida, setRestablecida] = useState(false);

  function handleOpenChange(siguiente: boolean) {
    if (!siguiente) {
      setContrasena(generarContrasenaTemporal());
      setError(null);
      setRestablecida(false);
    }
    onOpenChange(siguiente);
  }

  async function confirmar() {
    if (!empleado) return;
    setError(null);
    setGuardando(true);
    const resultado = await gestionarEmpleado('restablecer', {
      usuarioId: empleado.id,
      contrasenaTemporal: contrasena,
    });
    setGuardando(false);

    if (!resultado.ok) {
      setError(mensajeDeError(resultado.error));
      return;
    }
    setRestablecida(true);
  }

  return (
    <Dialog open={empleado !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-brand-lilac bg-brand-mist p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-night">Restablecer contraseña</DialogTitle>
          <DialogDescription className="text-brand-grape">
            {empleado
              ? `${empleado.nombre} deberá usar la nueva contraseña temporal y cambiarla al entrar.`
              : ''}
          </DialogDescription>
        </DialogHeader>

        {restablecida ? (
          <>
            <ContrasenaTemporalVisible contrasena={contrasena} />
            <DialogFooter>
              <Button
                type="button"
                size="lg"
                onClick={() => handleOpenChange(false)}
                className="w-full bg-brand-plum text-white hover:bg-brand-grape sm:w-auto"
              >
                Listo
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {error && (
              <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
                {error}
              </p>
            )}
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-5 ring-1 ring-brand-lilac">
              <span className="font-mono text-xl font-bold tracking-widest text-brand-night">{contrasena}</span>
              <Button
                type="button"
                variant="outline"
                onClick={() => setContrasena(generarContrasenaTemporal())}
                aria-label="Generar otra contraseña"
                className="h-10 w-10 border-brand-mauve bg-white p-0 text-brand-night hover:bg-brand-lilac/40"
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            <DialogFooter className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleOpenChange(false)}
                className="w-full border-brand-mauve bg-white text-brand-night hover:bg-brand-lilac/40 sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="lg"
                disabled={guardando}
                onClick={() => void confirmar()}
                className="w-full bg-brand-plum text-white hover:bg-brand-grape sm:w-auto"
              >
                {guardando ? 'Restableciendo...' : 'Restablecer'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
