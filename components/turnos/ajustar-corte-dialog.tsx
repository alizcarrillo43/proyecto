'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ajustarCorte, cerrarTurnoForzado } from '@/lib/turnos-api';
import { formatearDia } from '@/lib/format';

const MINIMO_MOTIVO = 10;

function ErrorBanner({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) return null;
  return (
    <div role="alert" className="mt-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
      {mensaje}
    </div>
  );
}

export function AjustarCorteDialog({
  open,
  onOpenChange,
  turnoId,
  fecha,
  onGuardado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turnoId: string;
  fecha: string;
  onGuardado: () => void;
}) {
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const montoNumero = Number(monto);
  const motivoLimpio = motivo.trim();
  const valido =
    monto.trim() !== '' &&
    Number.isFinite(montoNumero) &&
    montoNumero !== 0 &&
    Math.abs(montoNumero) <= 999999.99 &&
    motivoLimpio.length >= MINIMO_MOTIVO;

  async function guardar() {
    if (!valido || enviando) return;
    setEnviando(true);
    setError(null);
    const resultado = await ajustarCorte(turnoId, fecha, montoNumero, motivoLimpio);
    setEnviando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    toast.success('Ajuste registrado');
    setMonto('');
    setMotivo('');
    onGuardado();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(siguiente) => !enviando && onOpenChange(siguiente)}>
      <DialogContent className="rounded-3xl border-brand-lilac bg-white p-6 sm:max-w-md sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-night">Ajustar corte</DialogTitle>
          <DialogDescription className="text-brand-grape">
            Corte del {formatearDia(fecha)}. Usa un monto positivo para sumar o negativo para restar efectivo.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monto-ajuste" className="text-brand-night">Monto del ajuste</Label>
            <Input
              id="monto-ajuste"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="-50.00"
              value={monto}
              onChange={(evento) => setMonto(evento.target.value)}
              disabled={enviando}
              className="h-12 text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motivo-ajuste" className="text-brand-night">Motivo</Label>
            <Textarea
              id="motivo-ajuste"
              rows={3}
              placeholder="Explica por qué se corrige el corte (mínimo 10 caracteres)"
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              disabled={enviando}
            />
          </div>
        </div>

        <ErrorBanner mensaje={error} />

        <DialogFooter className="mt-6 gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={enviando}
            className="h-12 border-brand-plum text-brand-plum hover:bg-brand-lilac/40"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void guardar()}
            disabled={!valido || enviando}
            className="h-12 bg-brand-plum text-white hover:bg-brand-grape"
          >
            {enviando ? 'Guardando...' : 'Registrar ajuste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CerrarForzadoDialog({
  open,
  onOpenChange,
  turnoId,
  onCerrado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turnoId: string;
  onCerrado: () => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const motivoLimpio = motivo.trim();
  const valido = motivoLimpio.length >= MINIMO_MOTIVO;

  async function confirmar() {
    if (!valido || enviando) return;
    setEnviando(true);
    setError(null);
    const resultado = await cerrarTurnoForzado(turnoId, motivoLimpio);
    setEnviando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    toast.success('Turno cerrado por el encargado');
    setMotivo('');
    onCerrado();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(siguiente) => !enviando && onOpenChange(siguiente)}>
      <DialogContent className="rounded-3xl border-brand-lilac bg-white p-6 sm:max-w-md sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-night">Cerrar turno a la fuerza</DialogTitle>
          <DialogDescription className="text-brand-grape">
            El turno se cierra sin conteo de efectivo. Queda registrado quién lo cerró, cuándo y por qué.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-2">
          <Label htmlFor="motivo-cierre" className="text-brand-night">Motivo</Label>
          <Textarea
            id="motivo-cierre"
            rows={3}
            placeholder="Explica por qué se cierra el turno (mínimo 10 caracteres)"
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            disabled={enviando}
          />
        </div>

        <ErrorBanner mensaje={error} />

        <DialogFooter className="mt-6 gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={enviando}
            className="h-12 border-brand-plum text-brand-plum hover:bg-brand-lilac/40"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void confirmar()}
            disabled={!valido || enviando}
            className="h-12 bg-danger text-white hover:bg-danger/90"
          >
            {enviando ? 'Cerrando...' : 'Cerrar turno'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
