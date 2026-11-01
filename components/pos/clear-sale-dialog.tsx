'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function ClearSaleDialog({
  open,
  onOpenChange,
  onConfirmar,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl border-brand-lilac bg-brand-mist">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-brand-night">
            ¿Vaciar la venta actual?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-brand-grape">
            Se quitarán todos los artículos de esta venta. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="grid grid-cols-2 gap-3 sm:flex">
          <AlertDialogCancel className="mt-0 h-11 rounded-full border-brand-mauve bg-white text-brand-night hover:bg-brand-lilac/40">
            Volver
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmar}
            className="h-11 rounded-full bg-danger text-white hover:bg-danger/90"
          >
            Sí, vaciar venta
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
