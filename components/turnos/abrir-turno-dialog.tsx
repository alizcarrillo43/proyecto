'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { abrirTurno, cargarEmpleadosParaTurno, type DetalleTurno, type EmpleadoTurno } from '@/lib/turnos-api';

export function AbrirTurnoDialog({
  open,
  onOpenChange,
  onAbierto,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAbierto: (detalle: DetalleTurno) => void;
}) {
  const [empleados, setEmpleados] = useState<EmpleadoTurno[]>([]);
  const [cargando, setCargando] = useState(false);
  const [empleadoId, setEmpleadoId] = useState('');
  const [fondo, setFondo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let vigente = true;
    setCargando(true);
    setError(null);
    cargarEmpleadosParaTurno().then((resultado) => {
      if (!vigente) return;
      setCargando(false);
      if (!resultado.ok) setError(resultado.error);
      else setEmpleados(resultado.data);
    });
    return () => {
      vigente = false;
    };
  }, [open]);

  const montoFondo = Number(fondo);
  const valido = empleadoId !== '' && fondo.trim() !== '' && Number.isFinite(montoFondo) && montoFondo >= 0;

  async function abrir() {
    if (!valido || enviando) return;
    setEnviando(true);
    setError(null);
    const resultado = await abrirTurno(empleadoId, montoFondo);
    setEnviando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    toast.success('Turno abierto');
    setEmpleadoId('');
    setFondo('');
    onAbierto(resultado.data);
  }

  return (
    <Dialog open={open} onOpenChange={(siguiente) => !enviando && onOpenChange(siguiente)}>
      <DialogContent className="rounded-3xl border-brand-lilac bg-white p-6 sm:max-w-md sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-night">Abrir turno</DialogTitle>
          <DialogDescription className="text-brand-grape">
            Elige al empleado y el fondo con el que inicia su caja.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-brand-night">Empleado</Label>
            <Select value={empleadoId} onValueChange={setEmpleadoId} disabled={cargando || enviando}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder={cargando ? 'Cargando empleados...' : 'Elige un empleado'} />
              </SelectTrigger>
              <SelectContent>
                {empleados.map((empleado) => (
                  <SelectItem key={empleado.id} value={empleado.id}>
                    {empleado.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!cargando && empleados.length === 0 && !error && (
              <p className="text-xs text-brand-grape">No hay empleados activos para abrir un turno.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fondo-inicial" className="text-brand-night">Fondo inicial</Label>
            <Input
              id="fondo-inicial"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={fondo}
              onChange={(evento) => setFondo(evento.target.value)}
              disabled={enviando}
              className="h-12 text-lg"
            />
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {error}
          </div>
        )}

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
            onClick={() => void abrir()}
            disabled={!valido || enviando}
            className="h-12 bg-brand-plum text-white hover:bg-brand-grape"
          >
            {enviando ? 'Abriendo...' : 'Abrir turno'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
