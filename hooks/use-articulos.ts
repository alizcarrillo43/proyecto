'use client';

import { useCallback, useEffect, useState } from 'react';
import { cargarArticulos } from '@/lib/inventario-api';
import type { Articulo } from '@/lib/types';

export function useArticulos() {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setArticulos(await cargarArticulos());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { articulos, cargando, error, recargar };
}
