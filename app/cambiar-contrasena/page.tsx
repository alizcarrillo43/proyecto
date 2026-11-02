'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthBanner } from '@/components/auth-banner';
import { AuthShell } from '@/components/auth-shell';
import { PasswordInput } from '@/components/password-input';
import { RequireSession } from '@/components/require-session';
import { useSesion } from '@/components/session-provider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cambiarContrasenaPropia, mensajeDeError } from '@/lib/auth-api';

const CAMPO_CLASES =
  'border-brand-lilac bg-brand-lilac/40 placeholder:text-brand-plum/70 focus-visible:ring-brand-plum';
const ETIQUETA_CLASES = 'pl-1 text-brand-night';

export default function CambiarContrasenaPage() {
  return (
    <RequireSession>
      <CambiarContrasenaContenido />
    </RequireSession>
  );
}

function CambiarContrasenaContenido() {
  const router = useRouter();
  const { recargarPerfil } = useSesion();
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [errores, setErrores] = useState<{ nueva?: string; confirmar?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const erroresLocales: { nueva?: string; confirmar?: string } = {};
    if (nueva.length < 8) erroresLocales.nueva = 'Usa al menos 8 caracteres';
    if (confirmar !== nueva) erroresLocales.confirmar = 'Las contraseñas no coinciden';
    setErrores(erroresLocales);
    if (Object.keys(erroresLocales).length > 0) return;

    setEnviando(true);
    const resultado = await cambiarContrasenaPropia(nueva);
    if (!resultado.ok) {
      setEnviando(false);
      setError(mensajeDeError(resultado.error));
      return;
    }
    await recargarPerfil();
    router.replace('/ventas');
  }

  return (
    <AuthShell title="Crea tu contraseña" subtitle="Tu contraseña temporal debe cambiarse antes de continuar">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && <AuthBanner>{error}</AuthBanner>}

        <div className="space-y-2">
          <Label htmlFor="nueva-contrasena" className={ETIQUETA_CLASES}>Nueva contraseña</Label>
          <PasswordInput
            id="nueva-contrasena"
            value={nueva}
            onChange={(event) => setNueva(event.target.value)}
            autoComplete="new-password"
            aria-invalid={Boolean(errores.nueva)}
            className={CAMPO_CLASES}
          />
          {errores.nueva && <p className="pl-1 text-sm font-medium text-danger">{errores.nueva}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmar-contrasena" className={ETIQUETA_CLASES}>Confirmar contraseña</Label>
          <PasswordInput
            id="confirmar-contrasena"
            value={confirmar}
            onChange={(event) => setConfirmar(event.target.value)}
            autoComplete="new-password"
            aria-invalid={Boolean(errores.confirmar)}
            className={CAMPO_CLASES}
          />
          {errores.confirmar && <p className="pl-1 text-sm font-medium text-danger">{errores.confirmar}</p>}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={enviando}
          className="h-12 w-full bg-brand-plum text-white hover:bg-brand-grape"
        >
          {enviando ? 'Guardando...' : 'Guardar y continuar'}
        </Button>
      </form>
    </AuthShell>
  );
}
