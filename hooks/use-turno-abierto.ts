'use client';

import { useCallback, useEffect, useState } from 'react';
import { cargarTurnoAbiertoId } from '@/lib/turnos-api';

export type EstadoTurnoAbierto = 'cargando' | 'abierto' | 'sin_turno' | 'error';

export function useTurnoAbierto(activo: boolean) {
  const [estado, setEstado] = useState<EstadoTurnoAbierto>('cargando');
  const [turnoId, setTurnoId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!activo) return;
    setEstado('cargando');
    const resultado = await cargarTurnoAbiertoId();
    if (!resultado.ok) {
      setTurnoId(null);
      setEstado('error');
      return;
    }
    setTurnoId(resultado.data);
    setEstado(resultado.data ? 'abierto' : 'sin_turno');
  }, [activo]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { estado, turnoId, recargar: cargar };
}
