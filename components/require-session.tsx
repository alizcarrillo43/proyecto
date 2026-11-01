'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSesion } from '@/components/session-provider';

export function RequireSession({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { cargando, sesion } = useSesion();

  useEffect(() => {
    if (!cargando && !sesion) router.replace('/login');
  }, [cargando, sesion, router]);

  if (cargando || !sesion) {
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

  return <>{children}</>;
}
