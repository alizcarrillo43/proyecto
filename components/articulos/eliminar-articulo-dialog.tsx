'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { eliminarArticulo } from '@/lib/inventario-api';
import type { Articulo } from '@/lib/types';

export function EliminarArticuloDialog({
  articulo,
  onOpenChange,
  onEliminado,
}: {
  articulo: Articulo | null;
  onOpenChange: (open: boolean) => void;
  onEliminado: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  function handleOpenChange(siguiente: boolean) {
    if (!siguiente) setError(null);
    onOpenChange(siguiente);
  }

  async function confirmar() {
    if (!articulo) return;
    setError(null);
    setEliminando(true);
    const resultado = await eliminarArticulo(articulo.id);
    setEliminando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    handleOpenChange(false);
    onEliminado();
  }

  return (
    <Dialog open={articulo !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-brand-lilac bg-brand-mist p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-night">Eliminar artículo</DialogTitle>
          <DialogDescription className="text-brand-grape">
            {articulo
              ? `Se eliminará ${articulo.descripcion}, talla ${articulo.talla}, con ${articulo.existencias} pares en existencias. Las ventas anteriores seguirán en el historial. Esta acción no se puede deshacer.`
              : ''}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <DialogFooter className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => handleOpenChange(false)}
            className="w-full border-brand-mauve bg-white text-brand-night hover:bg-brand-lilac/40 sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={eliminando}
            onClick={() => void confirmar()}
            className="w-full bg-danger text-white hover:bg-danger/90 sm:w-auto"
          >
            {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
