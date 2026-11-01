'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatMXN } from '@/lib/format';
import type { Articulo } from '@/lib/types';

export function PriceLookupDialog({
  open,
  onOpenChange,
  articulos,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articulos: Articulo[];
}) {
  const [consulta, setConsulta] = useState('');
  const termino = consulta.trim().toLowerCase();
  const resultados = termino
    ? articulos.filter(
        (articulo) =>
          articulo.descripcion.toLowerCase().includes(termino) ||
          articulo.codigo.includes(termino)
      )
    : [];

  function handleOpenChange(siguiente: boolean) {
    if (!siguiente) setConsulta('');
    onOpenChange(siguiente);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border-brand-lilac bg-brand-mist p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-night">
            Consultar precio
          </DialogTitle>
          <DialogDescription className="text-brand-grape">
            Busca un artículo para ver su precio. No se agregará a la venta.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-plum"
          />
          <Input
            aria-label="Buscar artículo por descripción o código"
            value={consulta}
            onChange={(event) => setConsulta(event.target.value)}
            autoFocus
            placeholder="Descripción o código de barras"
            className="h-12 border-brand-lilac pl-12 focus-visible:ring-brand-plum"
          />
        </div>

        <div className="max-h-80 overflow-y-auto" aria-live="polite">
          {!termino && (
            <p className="py-8 text-center text-brand-grape">
              Escribe la descripción o el código para ver el precio.
            </p>
          )}
          {termino && resultados.length === 0 && (
            <p className="py-8 text-center text-brand-grape">
              No encontramos artículos con “{consulta.trim()}”.
            </p>
          )}
          {resultados.length > 0 && (
            <ul className="divide-y divide-brand-lilac">
              {resultados.map((articulo) => (
                <li
                  key={articulo.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-brand-night">
                      {articulo.descripcion}
                    </p>
                    <p className="text-sm text-brand-grape">
                      Talla {articulo.talla} · {articulo.existencias} en existencia
                    </p>
                  </div>
                  <p className="shrink-0 text-xl font-bold tabular-nums text-brand-night">
                    {formatMXN(articulo.precio)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
