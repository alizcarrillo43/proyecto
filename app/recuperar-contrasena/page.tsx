'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuthBanner } from '@/components/auth-banner';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  mensajeDeError,
  normalizarUsuario,
  restablecerContrasena,
  solicitarCodigo,
  verificarCodigo,
} from '@/lib/auth-api';

const CAMPO_CLASES =
  'border-brand-lilac bg-brand-lilac/40 placeholder:text-brand-plum/70 focus-visible:ring-brand-plum';
const ETIQUETA_CLASES = 'pl-1 text-brand-night';
const ENLACE_CLASES =
  'rounded-full font-semibold text-brand-plum underline-offset-4 transition-colors hover:text-brand-night hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-plum';
const BOTON_PRIMARIO = 'w-full bg-brand-plum text-white hover:bg-brand-grape';

type Paso = 'usuario' | 'codigo' | 'contrasena';

const TITULOS: Record<Paso, { titulo: string; subtitulo: string }> = {
  usuario: {
    titulo: 'Recuperar contraseña',
    subtitulo: 'Te enviaremos un código al teléfono de tu cuenta',
  },
  codigo: {
    titulo: 'Ingresa el código',
    subtitulo: 'Escribe los 6 dígitos que te llegaron por SMS',
  },
  contrasena: {
    titulo: 'Nueva contraseña',
    subtitulo: 'Usa al menos 8 caracteres',
  },
};

export default function RecuperarContrasenaPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>('usuario');
  const [usuario, setUsuario] = useState('');
  const [codigo, setCodigo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function pedirCodigo() {
    const resultado = await solicitarCodigo(usuario);
    if (!resultado.ok) {
      setError(mensajeDeError(resultado.error));
      return false;
    }
    toast.success('Enviamos un código al teléfono registrado en tu cuenta');
    return true;
  }

  async function handleUsuario(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!normalizarUsuario(usuario)) {
      setError('Escribe tu usuario');
      return;
    }
    setEnviando(true);
    const enviado = await pedirCodigo();
    setEnviando(false);
    if (enviado) setPaso('codigo');
  }

  async function handleCodigo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!/^[0-9]{6}$/.test(codigo)) {
      setError('El código tiene 6 dígitos');
      return;
    }
    setEnviando(true);
    const resultado = await verificarCodigo(usuario, codigo);
    setEnviando(false);
    if (!resultado.ok) {
      setError(mensajeDeError(resultado.error));
      return;
    }
    setPaso('contrasena');
  }

  async function handleContrasena(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (contrasena !== confirmacion) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setEnviando(true);
    const resultado = await restablecerContrasena(usuario, codigo, contrasena);
    setEnviando(false);
    if (!resultado.ok) {
      setError(mensajeDeError(resultado.error));
      if (resultado.error === 'codigo_vencido') setPaso('usuario');
      return;
    }
    toast.success('Contraseña actualizada. Ya puedes iniciar sesión.');
    router.replace('/login');
  }

  async function reenviarCodigo() {
    setError(null);
    setEnviando(true);
    await pedirCodigo();
    setEnviando(false);
  }

  const { titulo, subtitulo } = TITULOS[paso];

  return (
    <AuthShell title={titulo} subtitle={subtitulo}>
      {paso === 'usuario' && (
        <form onSubmit={handleUsuario} className="space-y-5" noValidate>
          {error && <AuthBanner>{error}</AuthBanner>}
          <div className="space-y-2">
            <Label htmlFor="usuario" className={ETIQUETA_CLASES}>
              Usuario
            </Label>
            <Input
              id="usuario"
              name="usuario"
              autoComplete="username"
              autoFocus
              value={usuario}
              onChange={(event) => setUsuario(event.target.value)}
              className={CAMPO_CLASES}
              placeholder="Tu usuario"
            />
          </div>
          <Button type="submit" size="lg" disabled={enviando} className={BOTON_PRIMARIO}>
            {enviando ? 'Enviando...' : 'Enviar código'}
          </Button>
          <p className="text-center text-sm text-brand-grape">
            <Link href="/login" className={ENLACE_CLASES}>
              Volver a iniciar sesión
            </Link>
          </p>
        </form>
      )}

      {paso === 'codigo' && (
        <form onSubmit={handleCodigo} className="space-y-5" noValidate>
          {error && <AuthBanner>{error}</AuthBanner>}
          <div className="space-y-2">
            <Label htmlFor="codigo" className={ETIQUETA_CLASES}>
              Código de verificación
            </Label>
            <Input
              id="codigo"
              name="codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={codigo}
              onChange={(event) => setCodigo(event.target.value.replace(/\D/g, ''))}
              className={`${CAMPO_CLASES} h-14 text-center text-2xl font-bold tracking-[0.5em] tabular-nums`}
              placeholder="000000"
            />
          </div>
          <Button type="submit" size="lg" disabled={enviando} className={BOTON_PRIMARIO}>
            {enviando ? 'Verificando...' : 'Verificar código'}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={reenviarCodigo} disabled={enviando} className={`${ENLACE_CLASES} px-2 py-1 disabled:opacity-50`}>
              Reenviar código
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setPaso('usuario');
              }}
              className={`${ENLACE_CLASES} px-2 py-1`}
            >
              Cambiar usuario
            </button>
          </div>
        </form>
      )}

      {paso === 'contrasena' && (
        <form onSubmit={handleContrasena} className="space-y-5" noValidate>
          {error && <AuthBanner>{error}</AuthBanner>}
          <div className="space-y-2">
            <Label htmlFor="nueva-contrasena" className={ETIQUETA_CLASES}>
              Nueva contraseña
            </Label>
            <Input
              id="nueva-contrasena"
              name="nueva-contrasena"
              type="password"
              autoComplete="new-password"
              autoFocus
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
              className={CAMPO_CLASES}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar-contrasena" className={ETIQUETA_CLASES}>
              Repite la contraseña
            </Label>
            <Input
              id="confirmar-contrasena"
              name="confirmar-contrasena"
              type="password"
              autoComplete="new-password"
              value={confirmacion}
              onChange={(event) => setConfirmacion(event.target.value)}
              className={CAMPO_CLASES}
              placeholder="Vuelve a escribirla"
            />
          </div>
          <Button type="submit" size="lg" disabled={enviando} className={BOTON_PRIMARIO}>
            {enviando ? 'Guardando...' : 'Restablecer contraseña'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
