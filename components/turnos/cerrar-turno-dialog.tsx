'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DiasTurnoList } from '@/components/turnos/dias-turno-list';
import { cerrarTurno, type DetalleTurno } from '@/lib/turnos-api';
import { formatMXN } from '@/lib/format';

export function CerrarTurnoDialog({
  open,
  onOpenChange,
  detalle,
  onCerrado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detalle: DetalleTurno;
  onCerrado: (detalle: DetalleTurno) => void;
}) {
  const [contado, setContado] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const montoContado = Number(contado);
  const valido = contado.trim() !== '' && Number.isFinite(montoContado) && montoContado >= 0;
  const { turno, dias, totales } = detalle;

  async function confirmar() {
    if (!valido || enviando) return;
    setEnviando(true);
    setError(null);
    const resultado = await cerrarTurno(turno.id, montoContado);
    setEnviando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    toast.success('Turno cerrado');
    setContado('');
    onCerrado(resultado.data);
  }

  return (
    <Dialog open={open} onOpenChange={(siguiente) => !enviando && onOpenChange(siguiente)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-brand-lilac bg-white p-6 sm:max-w-lg sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-night">Cerrar turno</DialogTitle>
          <DialogDescription className="text-brand-grape">
            Revisa el resumen y cuenta el efectivo de la caja antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4 rounded-2xl bg-brand-mist/60 p-4 text-sm text-brand-night">
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
            <dt className="text-brand-grape">Fondo inicial</dt>
            <dd className="text-right font-semibold tabular-nums">{formatMXN(turno.fondoInicial)}</dd>
            <dt className="text-brand-grape">Días trabajados</dt>
            <dd className="text-right font-semibold tabular-nums">{totales.diasTrabajados}</dd>
            <dt className="text-brand-grape">Total vendido</dt>
            <dd className="text-right font-semibold tabular-nums">{formatMXN(totales.totalVendido)}</dd>
            <dt className="text-brand-grape">Ventas en efectivo</dt>
            <dd className="text-right tabular-nums">{formatMXN(totales.totalEfectivo)}</dd>
            <dt className="text-brand-grape">Ventas con tarjeta</dt>
            <dd className="text-right tabular-nums">{formatMXN(totales.totalTarjeta)}</dd>
            <dt className="text-brand-grape">Ventas por transferencia</dt>
            <dd className="text-right tabular-nums">{formatMXN(totales.totalTransferencia)}</dd>
          </dl>

          <div className="border-t border-dashed border-brand-mauve pt-3">
            <div className="flex items-center justify-between">
              <span className="font-bold">Efectivo a entregar</span>
              <span className="text-xl font-bold tabular-nums">{formatMXN(totales.efectivoAEntregar)}</span>
            </div>
            <p className="mt-1 text-xs text-brand-grape">Fondo inicial más las ventas en efectivo.</p>
          </div>

          <div className="border-t border-dashed border-brand-mauve pt-3">
            <p className="mb-2 font-semibold text-brand-grape">Ventas por día</p>
            <DiasTurnoList dias={dias} />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="efectivo-contado" className="text-brand-night">Efectivo contado en caja</Label>
          <Input
            id="efectivo-contado"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={contado}
            onChange={(evento) => setContado(evento.target.value)}
            disabled={enviando}
            className="h-12 text-lg"
          />
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {error}
          </div>
        )}

        <p className="mt-4 text-sm text-brand-grape">
          Al confirmar, el turno se cierra y ya no se podrán registrar ventas en él.
        </p>

        <DialogFooter className="mt-6 gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={enviando}
            className="h-12 border-brand-plum text-brand-plum hover:bg-brand-lilac/40"
          >
            Volver
          </Button>
          <Button
            onClick={() => void confirmar()}
            disabled={!valido || enviando}
            className="h-12 bg-brand-plum text-white hover:bg-brand-grape"
          >
            {enviando ? 'Cerrando...' : 'Confirmar cierre'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
