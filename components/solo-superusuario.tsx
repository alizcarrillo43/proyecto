'use client';

import { useSesion } from '@/components/session-provider';

export function SoloSuperusuario({ children }: { children: React.ReactNode }) {
  const { perfil } = useSesion();

  if (!perfil) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          role="status"
          aria-label="Cargando"
          className="h-10 w-10 animate-spin rounded-full border-4 border-brand-lilac border-t-brand-plum"
        />
      </div>
    );
  }

  if (perfil.rol !== 'superusuario') {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
        <div className="rounded-3xl border-2 border-dashed border-brand-mauve bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-brand-night">No tienes acceso a esta sección</p>
          <p className="mt-1 text-brand-grape">Pide al dueño de la tienda si necesitas revisarla.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
