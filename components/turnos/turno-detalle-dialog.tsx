'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AjustarCorteDialog, CerrarForzadoDialog } from '@/components/turnos/ajustar-corte-dialog';
import { DiasTurnoList } from '@/components/turnos/dias-turno-list';
import { formatMXN, formatearDia, formatearFechaHora } from '@/lib/format';
import { cargarDetalleTurno, type DetalleTurno } from '@/lib/turnos-api';

type AjusteEnCurso = { fecha: string } | null;

export function TurnoDetalleDialog({
  turnoId,
  onOpenChange,
  onCambio,
}: {
  turnoId: string | null;
  onOpenChange: (open: boolean) => void;
  onCambio: () => void;
}) {
  const [detalle, setDetalle] = useState<DetalleTurno | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [ajuste, setAjuste] = useState<AjusteEnCurso>(null);
  const [forzando, setForzando] = useState(false);

  useEffect(() => {
    if (!turnoId) return;
    let vigente = true;
    setDetalle(null);
    setError(null);
    cargarDetalleTurno(turnoId).then((resultado) => {
      if (!vigente) return;
      if (resultado.ok) setDetalle(resultado.data);
      else setError(resultado.error);
    });
    return () => {
      vigente = false;
    };
  }, [turnoId, version]);

  function alCambiar() {
    setVersion((actual) => actual + 1);
    onCambio();
  }

  const abierto = turnoId !== null;
  const { turno, dias, ajustes, totales } = detalle ?? {
    turno: null,
    dias: [],
    ajustes: [],
    totales: null,
  };

  return (
    <>
      <Dialog open={abierto} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-brand-lilac bg-white p-6 sm:max-w-2xl sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-brand-night">
              {turno ? turno.empleadoNombre : 'Turno'}
            </DialogTitle>
            <DialogDescription className="text-brand-grape">
              {turno ? `Apertura ${formatearFechaHora(turno.fechaApertura)}` : 'Cargando turno...'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div role="alert" className="mt-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
              {error}
            </div>
          )}

          {turno && totales && (
            <div className="mt-4 space-y-6">
              <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-brand-mist/60 p-4 text-sm text-brand-night md:grid-cols-4">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-brand-grape">Estado</dt>
                  <dd className="mt-1 font-semibold">{turno.estado === 'abierto' ? 'Abierto' : 'Cerrado'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-brand-grape">Fondo inicial</dt>
                  <dd className="mt-1 font-semibold tabular-nums">{formatMXN(turno.fondoInicial)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-brand-grape">Días trabajados</dt>
                  <dd className="mt-1 font-semibold tabular-nums">{totales.diasTrabajados}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-brand-grape">Total vendido</dt>
                  <dd className="mt-1 font-semibold tabular-nums">{formatMXN(totales.totalVendido)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-brand-grape">Efectivo a entregar</dt>
                  <dd className="mt-1 font-semibold tabular-nums">{formatMXN(totales.efectivoAEntregar)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-brand-grape">Efectivo contado</dt>
                  <dd className="mt-1 font-semibold tabular-nums">
                    {turno.efectivoContado === null ? 'Sin conteo' : formatMXN(turno.efectivoContado)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-brand-grape">Diferencia</dt>
                  <dd className="mt-1 font-semibold tabular-nums">
                    {turno.diferencia === null ? 'Sin conteo' : formatMXN(turno.diferencia)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-brand-grape">Cierre</dt>
                  <dd className="mt-1 font-semibold">
                    {turno.fechaCierre ? formatearFechaHora(turno.fechaCierre) : 'Abierto'}
                  </dd>
                </div>
              </dl>

              {turno.cierreForzado && (
                <p className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
                  Cerrado por el encargado. Motivo: {turno.motivoCierreForzado}
                </p>
              )}

              <section className="space-y-3">
                <h3 className="font-bold text-brand-night">Cortes diarios</h3>
                <DiasTurnoList dias={dias} />
                {dias.some((dia) => dia.cerrado) && (
                  <ul className="space-y-2">
                    {dias
                      .filter((dia) => dia.cerrado)
                      .map((dia) => (
                        <li key={dia.fecha} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-mist/50 px-4 py-2 text-sm">
                          <span className="text-brand-night">
                            {formatearDia(dia.fecha)}
                            {dia.ajusteEfectivo !== 0 && (
                              <span className="ml-2 text-brand-grape">Ajuste {formatMXN(dia.ajusteEfectivo)}</span>
                            )}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAjuste({ fecha: dia.fecha })}
                            className="border-brand-plum text-brand-plum hover:bg-brand-lilac/40"
                          >
                            Ajustar corte
                          </Button>
                        </li>
                      ))}
                  </ul>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-brand-night">Ajustes registrados</h3>
                {ajustes.length === 0 ? (
                  <p className="text-sm text-brand-grape">No hay ajustes en este turno.</p>
                ) : (
                  <ul className="divide-y divide-brand-lilac/60 rounded-2xl border border-brand-lilac">
                    {ajustes.map((ajusteRegistrado) => (
                      <li key={ajusteRegistrado.id} className="space-y-1 px-4 py-3 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-semibold text-brand-night">{formatMXN(ajusteRegistrado.monto)}</span>
                          <span className="text-xs text-brand-grape">{formatearFechaHora(ajusteRegistrado.createdAt)}</span>
                        </div>
                        <p className="text-brand-night">{ajusteRegistrado.motivo}</p>
                        <p className="text-xs text-brand-grape">Registrado por {ajusteRegistrado.realizadoPor}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {turno.estado === 'abierto' && (
                <div className="flex justify-end border-t border-brand-lilac pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setForzando(true)}
                    className="h-11 border-danger text-danger hover:bg-danger-soft"
                  >
                    Cerrar turno a la fuerza
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {turno && ajuste && (
        <AjustarCorteDialog
          open
          onOpenChange={(siguiente) => !siguiente && setAjuste(null)}
          turnoId={turno.id}
          fecha={ajuste.fecha}
          onGuardado={alCambiar}
        />
      )}

      {turno && forzando && (
        <CerrarForzadoDialog
          open
          onOpenChange={(siguiente) => !siguiente && setForzando(false)}
          turnoId={turno.id}
          onCerrado={alCambiar}
        />
      )}
    </>
  );
}
