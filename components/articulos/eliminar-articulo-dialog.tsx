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
import { eliminarModelo } from '@/lib/inventario-api';
import type { ModeloArticulo } from '@/lib/types';

export function EliminarArticuloDialog({
  modelo,
  onOpenChange,
  onEliminado,
}: {
  modelo: ModeloArticulo | null;
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
    if (!modelo) return;
    setError(null);
    setEliminando(true);
    const resultado = await eliminarModelo(modelo.codigo);
    setEliminando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    handleOpenChange(false);
    onEliminado();
  }

  return (
    <Dialog open={modelo !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-brand-lilac bg-brand-mist p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-night">Eliminar artículo</DialogTitle>
          <DialogDescription className="text-brand-grape">
            {modelo
              ? `Se eliminará ${modelo.descripcion} con sus ${modelo.tallas.length} numeraciones. Las ventas anteriores seguirán en el historial. Esta acción no se puede deshacer.`
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
