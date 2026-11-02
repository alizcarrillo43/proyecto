'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSesion } from '@/components/session-provider';

const RUTA_CAMBIO_CONTRASENA = '/cambiar-contrasena';

function PantallaCargando() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-mist">
      <div
        role="status"
        aria-label="Cargando"
        className="h-10 w-10 animate-spin rounded-full border-4 border-brand-lilac border-t-brand-plum"
      />
    </div>
  );
}

export function RequireSession({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { cargando, sesion, perfil } = useSesion();
  const debeCambiar = perfil?.debe_cambiar_contrasena === true;
  const enCambio = pathname === RUTA_CAMBIO_CONTRASENA;

  useEffect(() => {
    if (cargando) return;
    if (!sesion) {
      router.replace('/login');
      return;
    }
    if (debeCambiar && !enCambio) router.replace(RUTA_CAMBIO_CONTRASENA);
  }, [cargando, sesion, debeCambiar, enCambio, router]);

  if (cargando || !sesion) return <PantallaCargando />;
  if (debeCambiar && !enCambio) return <PantallaCargando />;

  return <>{children}</>;
}
