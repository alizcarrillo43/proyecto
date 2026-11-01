'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthBanner } from '@/components/auth-banner';
import { AuthShell } from '@/components/auth-shell';
import { PasswordInput } from '@/components/password-input';
import { useSesion } from '@/components/session-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { iniciarSesion, mensajeDeError } from '@/lib/auth-api';

const CAMPO_CLASES =
  'border-brand-lilac bg-brand-lilac/40 placeholder:text-brand-plum/70 focus-visible:ring-brand-plum';
const ENLACE_CLASES =
  'rounded-full font-semibold text-brand-plum underline-offset-4 transition-colors hover:text-brand-night hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-plum';

export default function LoginPage() {
  const router = useRouter();
  const { cargando, sesion } = useSesion();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!cargando && sesion) router.replace('/ventas');
  }, [cargando, sesion, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEnviando(true);
    const resultado = await iniciarSesion(usuario, contrasena);
    setEnviando(false);

    if (!resultado.ok) {
      setError(mensajeDeError(resultado.error));
      setContrasena('');
      return;
    }
    router.replace('/ventas');
  }

  return (
    <AuthShell title="Inicia sesión" subtitle="Ingresa con tu usuario">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && <AuthBanner>{error}</AuthBanner>}

        <div className="space-y-2">
          <Label htmlFor="usuario" className="pl-1 text-brand-night">
            Usuario
          </Label>
          <Input
            id="usuario"
            name="usuario"
            autoComplete="username"
            autoFocus
            required
            value={usuario}
            onChange={(event) => setUsuario(event.target.value)}
            className={CAMPO_CLASES}
            placeholder="Tu usuario"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contrasena" className="pl-1 text-brand-night">
            Contraseña
          </Label>
          <PasswordInput
            id="contrasena"
            name="contrasena"
            autoComplete="current-password"
            required
            value={contrasena}
            onChange={(event) => setContrasena(event.target.value)}
            className={CAMPO_CLASES}
            placeholder="Tu contraseña"
          />
        </div>

        <div className="flex justify-end">
          <Link href="/recuperar-contrasena" className={`${ENLACE_CLASES} px-2 py-1 text-sm`}>
            Olvidé la contraseña
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={enviando}
          className="w-full bg-brand-plum text-white hover:bg-brand-grape"
        >
          {enviando ? 'Entrando...' : 'Continuar'}
        </Button>

        <p className="text-center text-sm text-brand-grape">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className={ENLACE_CLASES}>
            Registrarse
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
