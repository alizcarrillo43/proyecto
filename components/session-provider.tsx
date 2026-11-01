'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Perfil } from '@/lib/types';

type EstadoSesion = {
  cargando: boolean;
  sesion: Session | null;
  perfil: Perfil | null;
};

const SesionContext = createContext<EstadoSesion | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion>({
    cargando: true,
    sesion: null,
    perfil: null,
  });

  useEffect(() => {
    let activo = true;

    async function cargar(sesion: Session | null) {
      if (!sesion) {
        if (activo) setEstado({ cargando: false, sesion: null, perfil: null });
        return;
      }
      if (activo) setEstado({ cargando: false, sesion, perfil: null });

      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, usuario, rol')
        .eq('id', sesion.user.id)
        .maybeSingle();
      if (!activo) return;
      if (error) {
        console.error('No se pudo cargar el perfil', error);
        return;
      }
      setEstado({ cargando: false, sesion, perfil: data });
    }

    const { data: suscripcion } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      (async () => {
        await cargar(sesion);
      })();
    });

    return () => {
      activo = false;
      suscripcion.subscription.unsubscribe();
    };
  }, []);

  return <SesionContext.Provider value={estado}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  const contexto = useContext(SesionContext);
  if (!contexto) throw new Error('useSesion debe usarse dentro de SessionProvider');
  return contexto;
}
