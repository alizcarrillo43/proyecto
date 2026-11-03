'use client';

import { Banknote, CreditCard, ArrowLeftRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetodoPago } from '@/lib/inventario-api';

export const METODOS_PAGO: { valor: MetodoPago; etiqueta: string; icono: LucideIcon }[] = [
  { valor: 'efectivo', etiqueta: 'Efectivo', icono: Banknote },
  { valor: 'tarjeta', etiqueta: 'Tarjeta', icono: CreditCard },
  { valor: 'transferencia', etiqueta: 'Transferencia', icono: ArrowLeftRight },
];

export function etiquetaMetodoPago(valor: MetodoPago): string {
  return METODOS_PAGO.find((metodo) => metodo.valor === valor)?.etiqueta ?? valor;
}

export function MetodoPagoSelector({
  valor,
  onCambiar,
}: {
  valor: MetodoPago;
  onCambiar: (metodo: MetodoPago) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Método de pago" className="grid grid-cols-3 gap-2 rounded-2xl bg-white/70 p-1.5">
      {METODOS_PAGO.map(({ valor: metodo, etiqueta, icono: Icono }) => {
        const activo = metodo === valor;
        return (
          <button
            key={metodo}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onCambiar(metodo)}
            className={cn(
              'flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-plum',
              activo
                ? 'bg-brand-plum text-white shadow-sm'
                : 'text-brand-grape hover:bg-brand-lilac/50'
            )}
          >
            <Icono className="h-4 w-4" aria-hidden />
            {etiqueta}
          </button>
        );
      })}
    </div>
  );
}
