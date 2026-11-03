import { Button } from '@/components/ui/button';
import { MetodoPagoSelector } from '@/components/pos/metodo-pago-selector';
import { formatMXN } from '@/lib/format';
import type { MetodoPago } from '@/lib/inventario-api';

export function SaleSummary({
  piezas,
  total,
  hayLineas,
  metodoPago,
  onCambiarMetodo,
  onCobrar,
  onCancelar,
}: {
  piezas: number;
  total: number;
  hayLineas: boolean;
  metodoPago: MetodoPago;
  onCambiarMetodo: (metodo: MetodoPago) => void;
  onCobrar: () => void;
  onCancelar: () => void;
}) {
  return (
    <section aria-label="Resumen de la venta" className="space-y-4">
      <div className="grid gap-6 rounded-3xl bg-brand-lavender p-6 text-brand-night shadow-sm sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide">
            Número de artículos
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums">{piezas}</p>
        </div>
        <div className="md:text-right">
          <p className="text-sm font-semibold uppercase tracking-wide">Total</p>
          <p
            aria-live="polite"
            className="mt-1 text-5xl font-bold leading-none tabular-nums sm:text-6xl lg:text-7xl"
          >
            {formatMXN(total)}
          </p>
        </div>
      </div>

      <MetodoPagoSelector valor={metodoPago} onCambiar={onCambiarMetodo} />

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Button
          size="lg"
          onClick={onCobrar}
          disabled={!hayLineas}
          className="h-14 w-full bg-brand-plum text-lg text-white hover:bg-brand-grape sm:order-2 sm:w-56"
        >
          Cobrar
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onCancelar}
          disabled={!hayLineas}
          className="h-14 w-full border-brand-plum bg-white text-lg text-brand-plum hover:bg-brand-lilac/40 sm:order-1 sm:w-56"
        >
          Cancelar
        </Button>
      </div>
    </section>
  );
}
