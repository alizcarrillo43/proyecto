'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { CorteDelDiaCard } from '@/components/turnos/corte-del-dia-card';
import { CerrarTurnoDialog } from '@/components/turnos/cerrar-turno-dialog';
import { DiasTurnoList } from '@/components/turnos/dias-turno-list';
import { fechaDeHoy } from '@/lib/caja-api';
import { formatMXN, formatearFechaHora } from '@/lib/format';
import {
  cargarCorteDelDia,
  cargarDetalleTurno,
  cerrarDia,
  type CorteDelDia,
  type DetalleTurno,
} from '@/lib/turnos-api';

type Datos = { detalle: DetalleTurno; corte: CorteDelDia };

export function TurnoAbiertoPanel({
  turnoId,
  onCerrado,
}: {
  turnoId: string;
  onCerrado: (detalle: DetalleTurno) => void;
}) {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cerrandoDia, setCerrandoDia] = useState(false);
  const [confirmarDia, setConfirmarDia] = useState(false);
  const [cierreAbierto, setCierreAbierto] = useState(false);

  const recargar = useCallback(async () => {
    const [detalle, corte] = await Promise.all([
      cargarDetalleTurno(turnoId),
      cargarCorteDelDia(turnoId, fechaDeHoy()),
    ]);
    if (!detalle.ok) {
      setError(detalle.error);
      return;
    }
    if (!corte.ok) {
      setError(corte.error);
      return;
    }
    setError(null);
    setDatos({ detalle: detalle.data, corte: corte.data });
  }, [turnoId]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  async function guardarDia() {
    setCerrandoDia(true);
    const resultado = await cerrarDia(turnoId);
    setCerrandoDia(false);
    setConfirmarDia(false);
    if (!resultado.ok) {
      toast.error(resultado.error);
      return;
    }
    toast.success('Corte del día guardado');
    void recargar();
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
        <span>{error}</span>
        <Button variant="outline" onClick={() => void recargar()} className="h-9 border-danger text-danger">
          Reintentar
        </Button>
      </div>
    );
  }

  if (!datos) {
    return <p className="p-6 text-center text-sm font-medium text-brand-grape" role="status">Cargando tu turno...</p>;
  }

  const { detalle, corte } = datos;
  const { turno, dias, totales } = detalle;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-brand-lavender p-6 text-brand-night shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide">Turno abierto</p>
        <p className="mt-1 text-sm">Desde {formatearFechaHora(turno.fechaApertura)}</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide">Fondo inicial</p>
            <p className="text-2xl font-bold tabular-nums">{formatMXN(turno.fondoInicial)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide">Días trabajados</p>
            <p className="text-2xl font-bold tabular-nums">{totales.diasTrabajados}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide">Total vendido en el turno</p>
            <p className="text-2xl font-bold tabular-nums">{formatMXN(totales.totalVendido)}</p>
          </div>
        </div>
      </section>

      <CorteDelDiaCard corte={corte} cerrando={cerrandoDia} onCerrarDia={() => setConfirmarDia(true)} />

      <section className="rounded-3xl border border-brand-lilac bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-brand-night">Ventas por día</h2>
            <p className="text-sm text-brand-grape">Total acumulado del turno, día por día.</p>
          </div>
          <Button
            onClick={() => setCierreAbierto(true)}
            className="h-12 bg-brand-plum px-6 text-white hover:bg-brand-grape"
          >
            Cerrar turno
          </Button>
        </div>
        <div className="mt-6">
          <DiasTurnoList dias={dias} />
        </div>
      </section>

      <AlertDialog open={confirmarDia} onOpenChange={setConfirmarDia}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar el corte de hoy</AlertDialogTitle>
            <AlertDialogDescription>
              Se guardará el corte de hoy con sus ventas. Después no podrás registrar más ventas hoy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cerrandoDia}>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={(evento) => {
                evento.preventDefault();
                void guardarDia();
              }}
              disabled={cerrandoDia}
              className="bg-brand-plum text-white hover:bg-brand-grape"
            >
              Cerrar día
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CerrarTurnoDialog
        open={cierreAbierto}
        onOpenChange={setCierreAbierto}
        detalle={detalle}
        onCerrado={(cerrado) => {
          setCierreAbierto(false);
          onCerrado(cerrado);
        }}
      />
    </div>
  );
}
