'use client';

import { useEffect, useState } from 'react';
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
import { guardarCajaDeHoy, type CajaDelDia } from '@/lib/caja-api';

export function CajaInicialDialog({
  open,
  onOpenChange,
  montoActual,
  onGuardado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  montoActual: number | null;
  onGuardado: (caja: CajaDelDia) => void;
}) {
  const [valor, setValor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      setValor(montoActual === null ? '' : String(montoActual));
      setError(null);
    }
  }, [open, montoActual]);

  async function confirmar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const monto = Number(valor.replace(',', '.'));
    if (valor.trim() === '' || !Number.isFinite(monto) || monto < 0) {
      setError('Ingresa un monto válido, mayor o igual a 0.');
      return;
    }
    setError(null);
    setGuardando(true);
    const resultado = await guardarCajaDeHoy(Math.round(monto * 100) / 100);
    setGuardando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    onGuardado(resultado.caja);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-brand-lilac bg-brand-mist p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-night">Caja inicial del día</DialogTitle>
          <DialogDescription className="text-brand-grape">
            Anota el efectivo con el que inicia la caja hoy. Puedes corregirlo mientras sea el mismo día.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={confirmar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="caja-inicial" className="pl-1 text-brand-night">
              Efectivo en caja
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-brand-plum">
                $
              </span>
              <Input
                id="caja-inicial"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={valor}
                onChange={(event) => setValor(event.target.value)}
                autoFocus
                placeholder="0.00"
                className="h-12 border-brand-lilac bg-white pl-8 text-lg tabular-nums focus-visible:ring-brand-plum"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}

          <DialogFooter className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="w-full border-brand-mauve bg-white text-brand-night hover:bg-brand-lilac/40 sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={guardando}
              className="w-full bg-brand-plum text-white hover:bg-brand-grape sm:w-auto"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
