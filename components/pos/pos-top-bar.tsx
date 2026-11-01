'use client';

import Link from 'next/link';
import { Banknote, PackagePlus, Receipt, Tag } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useSesion } from '@/components/session-provider';
import { iniciales } from '@/lib/format';

const BOTON_SECUNDARIO =
  'h-11 justify-start gap-2 border-brand-plum bg-white px-4 text-brand-plum hover:bg-brand-lilac/40 hover:text-brand-night sm:justify-center';

export function PosTopBar({
  onConsultarPrecio,
  onNuevaVenta,
  onRetirarEfectivo,
}: {
  onConsultarPrecio: () => void;
  onNuevaVenta: () => void;
  onRetirarEfectivo: () => void;
}) {
  const { perfil } = useSesion();
  const nombre = perfil?.nombre ?? 'Vendedor';

  return (
    <header className="sticky top-0 z-20 border-b border-brand-lilac bg-white/95 backdrop-blur">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button asChild variant="secondary" className="h-11 justify-start gap-2 px-4 sm:justify-center">
            <Link href="/articulos">
              <PackagePlus className="h-4 w-4" aria-hidden />
              Agregar artículo
            </Link>
          </Button>
          <Button variant="secondary" onClick={onConsultarPrecio} className="h-11 justify-start gap-2 px-4 sm:justify-center">
            <Tag className="h-4 w-4" aria-hidden />
            Consultar precio
          </Button>
          <Button variant="outline" onClick={onNuevaVenta} className={BOTON_SECUNDARIO}>
            <Receipt className="h-4 w-4" aria-hidden />
            Nueva venta
          </Button>
          <Button variant="outline" onClick={onRetirarEfectivo} className={BOTON_SECUNDARIO}>
            <Banknote className="h-4 w-4" aria-hidden />
            Retirar efectivo
          </Button>
        </div>

        <div className="flex items-center justify-end gap-3">
          <span className="text-base font-semibold text-brand-night">
            {nombre}
          </span>
          <Avatar className="h-11 w-11">
            <AvatarFallback className="bg-brand-plum font-semibold text-white">
              {iniciales(nombre)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
