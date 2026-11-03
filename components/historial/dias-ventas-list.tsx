import { ChevronRight, Receipt } from 'lucide-react';
import type { ResumenDia } from '@/lib/historial-api';
import { formatMXN } from '@/lib/format';

export function DiasVentasList({
  dias,
  onSeleccionar,
}: {
  dias: ResumenDia[];
  onSeleccionar: (clave: string) => void;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {dias.map((dia) => (
        <li key={dia.clave}>
          <button
            type="button"
            onClick={() => onSeleccionar(dia.clave)}
            className="group flex w-full flex-col gap-4 rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-brand-lilac transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-plum"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-grape first-letter:uppercase">
                  {dia.etiqueta}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-brand-night">{formatMXN(dia.total)}</p>
              </div>
              <ChevronRight
                aria-hidden
                className="mt-1 h-5 w-5 shrink-0 text-brand-plum transition-transform duration-200 group-hover:translate-x-1"
              />
            </div>
            <p className="flex items-center gap-2 text-sm text-brand-grape">
              <Receipt className="h-4 w-4 text-brand-plum" aria-hidden />
              {dia.ventas} {dia.ventas === 1 ? 'venta' : 'ventas'} · {dia.piezas} {dia.piezas === 1 ? 'pieza' : 'piezas'}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
