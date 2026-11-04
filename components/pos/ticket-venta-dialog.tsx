'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { etiquetaMetodoPago } from '@/components/pos/metodo-pago-selector';
import { formatMXN } from '@/lib/format';
import type { MetodoPago } from '@/lib/inventario-api';
import type { LineaVenta } from '@/lib/types';

export type TicketVenta = {
  folio: string;
  fecha: Date;
  vendedor: string;
  lineas: LineaVenta[];
  total: number;
  metodoPago: MetodoPago;
};

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function TicketVentaDialog({
  ticket,
  onOpenChange,
}: {
  ticket: TicketVenta | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={ticket !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-brand-lilac bg-white p-6 sm:p-8">
        {ticket && (
          <>
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-2xl font-bold text-brand-night">Venta cobrada</DialogTitle>
              <DialogDescription className="text-brand-grape">
                Ticket de venta {ticket.folio}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 rounded-2xl border border-dashed border-brand-mauve bg-brand-mist/60 p-4 text-sm text-brand-night">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <dt className="font-semibold text-brand-grape">Folio</dt>
                <dd className="text-right font-semibold tabular-nums">{ticket.folio}</dd>
                <dt className="font-semibold text-brand-grape">Fecha</dt>
                <dd className="text-right tabular-nums">{formatoFecha.format(ticket.fecha)}</dd>
                <dt className="font-semibold text-brand-grape">Vendedor</dt>
                <dd className="text-right">{ticket.vendedor}</dd>
                <dt className="font-semibold text-brand-grape">Pago</dt>
                <dd className="text-right">{etiquetaMetodoPago(ticket.metodoPago)}</dd>
              </dl>

              <div className="my-4 border-t border-dashed border-brand-mauve" />

              <ul className="space-y-3">
                {ticket.lineas.map((linea) => (
                  <li key={linea.articuloId} className="grid grid-cols-[1fr_auto] gap-x-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{linea.descripcion}</p>
                      <p className="text-brand-grape">
                        {linea.color ? `${linea.color} · ` : ''}Talla {linea.talla} · {linea.cantidad} x {formatMXN(linea.precio)}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums">{formatMXN(linea.precio * linea.cantidad)}</p>
                  </li>
                ))}
              </ul>

              <div className="my-4 border-t border-dashed border-brand-mauve" />

              <div className="flex items-center justify-between">
                <span className="text-base font-bold">Total</span>
                <span className="text-2xl font-bold tabular-nums text-brand-night">{formatMXN(ticket.total)}</span>
              </div>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="mt-6 h-12 w-full bg-brand-plum text-white hover:bg-brand-grape"
            >
              Nueva venta
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
