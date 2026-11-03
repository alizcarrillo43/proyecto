import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DiasTurnoList } from '@/components/turnos/dias-turno-list';
import { formatMXN, formatearDia, formatearFechaHora } from '@/lib/format';
import type { DetalleTurno } from '@/lib/turnos-api';

const ESTILOS_IMPRESION = `
@media print {
  body * { visibility: hidden !important; }
  #comprobante-turno, #comprobante-turno * { visibility: visible !important; }
  #comprobante-turno {
    position: absolute;
    left: 0;
    top: 0;
    width: 80mm;
    margin: 0;
    border: 0;
    box-shadow: none;
    border-radius: 0;
  }
}
`;

function textoDiferencia(diferencia: number | null) {
  if (diferencia === null) return 'Sin conteo';
  if (diferencia > 0) return `Sobrante ${formatMXN(diferencia)}`;
  if (diferencia < 0) return `Faltante ${formatMXN(Math.abs(diferencia))}`;
  return 'Caja cuadrada';
}

export function ComprobanteTurno({ detalle }: { detalle: DetalleTurno }) {
  const { turno, dias, totales } = detalle;

  return (
    <section className="space-y-4">
      <article
        id="comprobante-turno"
        className="mx-auto max-w-sm rounded-3xl border border-dashed border-brand-mauve bg-white p-6 text-sm text-brand-night"
      >
        <header className="text-center">
          <p className="text-lg font-bold">Paso Firme</p>
          <p className="text-brand-grape">Comprobante de cierre de turno</p>
        </header>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="font-semibold text-brand-grape">Empleado</dt>
          <dd className="text-right">{turno.empleadoNombre}</dd>
          <dt className="font-semibold text-brand-grape">Apertura</dt>
          <dd className="text-right tabular-nums">{formatearFechaHora(turno.fechaApertura)}</dd>
          <dt className="font-semibold text-brand-grape">Cierre</dt>
          <dd className="text-right tabular-nums">
            {turno.fechaCierre ? formatearFechaHora(turno.fechaCierre) : 'Pendiente'}
          </dd>
          <dt className="font-semibold text-brand-grape">Días trabajados</dt>
          <dd className="text-right tabular-nums">{totales.diasTrabajados}</dd>
        </dl>

        <div className="my-4 border-t border-dashed border-brand-mauve" />

        <div className="flex items-center justify-between">
          <span>Fondo inicial</span>
          <span className="tabular-nums">{formatMXN(turno.fondoInicial)}</span>
        </div>

        <div className="mt-4">
          <p className="mb-2 font-semibold text-brand-grape">Ventas por día</p>
          {dias.length === 0 ? (
            <p className="text-brand-grape">Sin ventas</p>
          ) : (
            <ul className="space-y-1">
              {dias.map((dia) => (
                <li key={dia.fecha} className="flex items-center justify-between gap-2">
                  <span>{formatearDia(dia.fecha)}</span>
                  <span className="tabular-nums">{formatMXN(dia.totalVendido)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="my-4 border-t border-dashed border-brand-mauve" />

        <div className="space-y-1">
          <div className="flex items-center justify-between font-bold">
            <span>Total vendido</span>
            <span className="tabular-nums">{formatMXN(totales.totalVendido)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Efectivo</span>
            <span className="tabular-nums">{formatMXN(totales.totalEfectivo)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Tarjeta</span>
            <span className="tabular-nums">{formatMXN(totales.totalTarjeta)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Transferencia</span>
            <span className="tabular-nums">{formatMXN(totales.totalTransferencia)}</span>
          </div>
          {totales.ajusteEfectivo !== 0 && (
            <div className="flex items-center justify-between">
              <span>Ajustes de efectivo</span>
              <span className="tabular-nums">{formatMXN(totales.ajusteEfectivo)}</span>
            </div>
          )}
        </div>

        <div className="my-4 border-t border-dashed border-brand-mauve" />

        <div className="space-y-1">
          <div className="flex items-center justify-between font-bold">
            <span>Efectivo a entregar</span>
            <span className="tabular-nums">{formatMXN(totales.efectivoAEntregar)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Efectivo contado</span>
            <span className="tabular-nums">
              {turno.efectivoContado === null ? 'Sin conteo' : formatMXN(turno.efectivoContado)}
            </span>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <span>Diferencia</span>
            <span className="tabular-nums">{textoDiferencia(turno.diferencia)}</span>
          </div>
        </div>

        {turno.cierreForzado && (
          <p className="mt-4 rounded-xl bg-brand-mist/60 p-3 text-xs text-brand-grape">
            Turno cerrado por el encargado. Motivo: {turno.motivoCierreForzado}
          </p>
        )}
      </article>

      <div className="flex justify-center print:hidden">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="h-11 border-brand-plum text-brand-plum hover:bg-brand-lilac/40"
        >
          <Printer className="mr-2 h-4 w-4" aria-hidden />
          Imprimir comprobante
        </Button>
      </div>

      <style>{ESTILOS_IMPRESION}</style>
    </section>
  );
}
