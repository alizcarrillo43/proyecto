'use client';

import { useCallback, useEffect, useState } from 'react';
import { listarEmpleados } from '@/lib/empleados-api';
import type { Empleado } from '@/lib/types';

export function useEmpleados() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setEmpleados(await listarEmpleados());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { empleados, cargando, error, recargar };
}
