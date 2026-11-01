'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ErroresRetiro = { monto?: string; motivo?: string };

export function CashWithdrawalDialog({
  open,
  onOpenChange,
  onRegistrar,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistrar: (retiro: { monto: number; motivo: string }) => void;
}) {
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [errores, setErrores] = useState<ErroresRetiro>({});

  function limpiarFormulario() {
    setMonto('');
    setMotivo('');
    setErrores({});
  }

  function handleOpenChange(siguiente: boolean) {
    if (!siguiente) limpiarFormulario();
    onOpenChange(siguiente);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const montoNumero = Number(monto);
    const nuevosErrores: ErroresRetiro = {};

    if (!monto || !Number.isFinite(montoNumero) || montoNumero <= 0) {
      nuevosErrores.monto = 'Ingresa un monto mayor a cero';
    }
    if (!motivo.trim()) {
      nuevosErrores.motivo = 'Escribe el motivo del retiro';
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    onRegistrar({
      monto: Math.round(montoNumero * 100) / 100,
      motivo: motivo.trim(),
    });
    limpiarFormulario();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-brand-lilac bg-brand-mist p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-night">
            Retirar efectivo
          </DialogTitle>
          <DialogDescription className="text-brand-grape">
            Registra el dinero que sacas de la caja.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="retiro-monto" className="pl-1 text-brand-night">
              Monto
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-brand-plum">
                $
              </span>
              <Input
                id="retiro-monto"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={monto}
                onChange={(event) => setMonto(event.target.value)}
                aria-invalid={Boolean(errores.monto)}
                aria-describedby={errores.monto ? 'retiro-monto-error' : undefined}
                placeholder="0.00"
                className="h-12 border-brand-lilac pl-9 tabular-nums focus-visible:ring-brand-plum"
              />
            </div>
            {errores.monto && (
              <p id="retiro-monto-error" className="pl-1 text-sm font-medium text-danger">
                {errores.monto}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="retiro-motivo" className="pl-1 text-brand-night">
              Motivo
            </Label>
            <Input
              id="retiro-motivo"
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              aria-invalid={Boolean(errores.motivo)}
              aria-describedby={errores.motivo ? 'retiro-motivo-error' : undefined}
              placeholder="Por ejemplo: pago de limpieza"
              className="h-12 border-brand-lilac focus-visible:ring-brand-plum"
            />
            {errores.motivo && (
              <p id="retiro-motivo-error" className="pl-1 text-sm font-medium text-danger">
                {errores.motivo}
              </p>
            )}
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
              type="submit"
              size="lg"
              className="w-full bg-brand-plum text-white hover:bg-brand-grape sm:w-auto"
            >
              Registrar retiro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
