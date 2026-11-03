import { Button } from '@/components/ui/button';
import { formatMXN, formatearDia } from '@/lib/format';
import type { CorteDelDia } from '@/lib/turnos-api';

export function CorteDelDiaCard({
  corte,
  cerrando,
  onCerrarDia,
}: {
  corte: CorteDelDia;
  cerrando: boolean;
  onCerrarDia: () => void;
}) {
  return (
    <section aria-label="Corte del día" className="rounded-3xl border border-brand-lilac bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-grape">Corte del día</p>
          <h2 className="mt-1 text-2xl font-bold text-brand-night">{formatearDia(corte.fecha)}</h2>
        </div>
        {corte.cerrado ? (
          <span className="rounded-full bg-brand-lavender px-3 py-1 text-sm font-semibold text-brand-night">
            Corte guardado
          </span>
        ) : (
          <Button
            variant="outline"
            onClick={onCerrarDia}
            disabled={cerrando}
            className="border-brand-plum text-brand-plum hover:bg-brand-lilac/40"
          >
            {cerrando ? 'Guardando...' : 'Cerrar día'}
          </Button>
        )}
      </div>

      {corte.cerrado && (
        <p className="mt-4 rounded-2xl bg-brand-mist/60 px-4 py-3 text-sm text-brand-night">
          El corte de hoy ya está cerrado. Las ventas de hoy quedaron bloqueadas y podrás vender de nuevo mañana.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metrica etiqueta="Ventas" valor={String(corte.numVentas)} />
        <Metrica etiqueta="Artículos" valor={String(corte.piezas)} />
        <Metrica etiqueta="Total vendido" valor={formatMXN(corte.totalVendido)} destacado />
        <Metrica etiqueta="Ajustes de efectivo" valor={formatMXN(corte.ajusteEfectivo)} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Metrica etiqueta="Efectivo" valor={formatMXN(corte.porMetodo.efectivo)} pequena />
        <Metrica etiqueta="Tarjeta" valor={formatMXN(corte.porMetodo.tarjeta)} pequena />
        <Metrica etiqueta="Transferencia" valor={formatMXN(corte.porMetodo.transferencia)} pequena />
      </div>

      <div className="mt-6">
        {corte.articulos.length === 0 ? (
          <p className="text-sm text-brand-grape">Hoy todavía no hay artículos vendidos.</p>
        ) : (
          <ul className="divide-y divide-brand-lilac/60">
            {corte.articulos.map((articulo) => (
              <li key={`${articulo.descripcion}-${articulo.talla}`} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-brand-night">{articulo.descripcion}</p>
                  <p className="text-sm text-brand-grape">Talla {articulo.talla} · {articulo.cantidad} pza.</p>
                </div>
                <p className="font-semibold tabular-nums text-brand-night">{formatMXN(articulo.importe)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Metrica({
  etiqueta,
  valor,
  destacado = false,
  pequena = false,
}: {
  etiqueta: string;
  valor: string;
  destacado?: boolean;
  pequena?: boolean;
}) {
  return (
    <div className={destacado ? 'rounded-2xl bg-brand-lavender p-4 text-brand-night' : 'rounded-2xl bg-brand-mist/50 p-4 text-brand-night'}>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-grape">{etiqueta}</p>
      <p className={pequena ? 'mt-1 text-lg font-bold tabular-nums' : 'mt-1 text-2xl font-bold tabular-nums'}>{valor}</p>
    </div>
  );
}
