'use client';

import { useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import { CajaInicialDialog } from '@/components/pos/caja-inicial-dialog';
import { useSesion } from '@/components/session-provider';
import { Button } from '@/components/ui/button';
import { cargarCajaDeHoy, type CajaDelDia } from '@/lib/caja-api';
import { formatMXN } from '@/lib/format';

function horaDeActualizacion(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function CajaInicialCard() {
  const { perfil } = useSesion();
  const puedeEditar = perfil?.rol === 'superusuario';
  const [caja, setCaja] = useState<CajaDelDia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);

  async function cargar() {
    setCargando(true);
    const resultado = await cargarCajaDeHoy();
    setCargando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setError(null);
    setCaja(resultado.caja);
  }

  useEffect(() => {
    void cargar();
  }, []);

  return (
    <section
      aria-labelledby="caja-inicial-titulo"
      className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-lilac sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-lilac/60 text-brand-plum">
          <Landmark className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="caja-inicial-titulo" className="text-sm font-semibold uppercase tracking-wide text-brand-grape">
            Caja inicial de hoy
          </h2>
          {error ? (
            <p role="alert" className="text-sm font-medium text-danger">{error}</p>
          ) : cargando ? (
            <p className="text-brand-grape">Cargando...</p>
          ) : caja ? (
            <p className="text-2xl font-bold tabular-nums text-brand-night">
              {formatMXN(caja.monto)}
              <span className="ml-2 text-sm font-medium text-brand-grape">
                actualizada a las {horaDeActualizacion(caja.actualizadoEn)}
              </span>
            </p>
          ) : (
            <p className="text-brand-grape">
              {puedeEditar ? 'Aún no registras el efectivo con el que inicia la caja.' : 'El superusuario aún no registra la caja inicial.'}
            </p>
          )}
        </div>
      </div>

      {puedeEditar && !cargando && !error && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setDialogoAbierto(true)}
          className="h-11 border-brand-plum bg-white px-5 text-brand-plum hover:bg-brand-lilac/40 hover:text-brand-night"
        >
          {caja ? 'Corregir monto' : 'Registrar caja inicial'}
        </Button>
      )}

      {puedeEditar && (
        <CajaInicialDialog
          open={dialogoAbierto}
          onOpenChange={setDialogoAbierto}
          montoActual={caja?.monto ?? null}
          onGuardado={setCaja}
        />
      )}
    </section>
  );
}
