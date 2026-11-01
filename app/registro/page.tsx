'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthBanner } from '@/components/auth-banner';
import { AuthShell } from '@/components/auth-shell';
import { PasswordInput } from '@/components/password-input';
import { TelefonoInput } from '@/components/telefono-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { iniciarSesion, mensajeDeError, registrarUsuario } from '@/lib/auth-api';
import { LADA_POR_DEFECTO } from '@/lib/paises';

const CAMPO_CLASES =
  'border-brand-lilac bg-brand-lilac/40 placeholder:text-brand-plum/70 focus-visible:ring-brand-plum';
const ETIQUETA_CLASES = 'pl-1 text-brand-night';
const USUARIO_REGEX = /^[a-z0-9._-]{3,30}$/;

type Campos = {
  nombre: string;
  lada: string;
  telefono: string;
  usuario: string;
  contrasena: string;
  confirmar: string;
};
type Errores = Partial<Record<keyof Campos, string>>;

const CAMPOS_VACIOS: Campos = {
  nombre: '',
  lada: LADA_POR_DEFECTO,
  telefono: '',
  usuario: '',
  contrasena: '',
  confirmar: '',
};

function validar(campos: Campos): Errores {
  const errores: Errores = {};
  if (!campos.nombre.trim()) errores.nombre = 'Escribe tu nombre';
  if (!/^[0-9]{10}$/.test(campos.telefono.trim())) {
    errores.telefono = 'Escribe un teléfono de 10 dígitos, solo con números';
  }
  if (!USUARIO_REGEX.test(campos.usuario.trim().toLowerCase())) {
    errores.usuario = 'Usa de 3 a 30 letras, números, puntos, guiones o guiones bajos';
  }
  if (campos.contrasena.length < 8) errores.contrasena = 'Usa al menos 8 caracteres';
  if (campos.confirmar !== campos.contrasena) errores.confirmar = 'Las contraseñas no coinciden';
  return errores;
}

export default function RegistroPage() {
  const router = useRouter();
  const [campos, setCampos] = useState<Campos>(CAMPOS_VACIOS);
  const [errores, setErrores] = useState<Errores>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function actualizarCampo(campo: keyof Campos, valor: string) {
    setCampos((actuales) => ({ ...actuales, [campo]: valor }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const erroresLocales = validar(campos);
    setErrores(erroresLocales);
    if (Object.keys(erroresLocales).length > 0) return;

    setEnviando(true);
    const resultado = await registrarUsuario({
      nombre: campos.nombre.trim(),
      lada: campos.lada,
      telefono: campos.telefono.trim(),
      usuario: campos.usuario,
      contrasena: campos.contrasena,
    });

    if (!resultado.ok) {
      setEnviando(false);
      if (resultado.error === 'usuario_existe') {
        setErrores({ usuario: mensajeDeError(resultado.error) });
      } else if (resultado.error === 'telefono_existe') {
        setErrores({ telefono: mensajeDeError(resultado.error) });
      } else {
        setError(mensajeDeError(resultado.error));
      }
      return;
    }

    const acceso = await iniciarSesion(campos.usuario, campos.contrasena);
    setEnviando(false);
    if (acceso.ok) {
      router.replace('/ventas');
      return;
    }
    router.replace('/login');
  }

  return (
    <AuthShell title="Registro" subtitle="Ingresa tus datos">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && <AuthBanner>{error}</AuthBanner>}

        <div className="space-y-2">
          <Label htmlFor="nombre" className={ETIQUETA_CLASES}>
            Nombre
          </Label>
          <Input
            id="nombre"
            name="nombre"
            autoComplete="name"
            autoFocus
            value={campos.nombre}
            onChange={(event) => actualizarCampo('nombre', event.target.value)}
            aria-invalid={Boolean(errores.nombre)}
            aria-describedby={errores.nombre ? 'nombre-error' : undefined}
            className={CAMPO_CLASES}
            placeholder="Nombre y apellido"
          />
          {errores.nombre && (
            <p id="nombre-error" className="pl-1 text-sm font-medium text-danger">{errores.nombre}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono" className={ETIQUETA_CLASES}>
            Teléfono
          </Label>
          <TelefonoInput
            id="telefono"
            lada={campos.lada}
            telefono={campos.telefono}
            onLadaChange={(lada) => actualizarCampo('lada', lada)}
            onTelefonoChange={(telefono) => actualizarCampo('telefono', telefono)}
            invalido={Boolean(errores.telefono)}
            describedBy={errores.telefono ? 'telefono-error' : 'telefono-ayuda'}
            campoClases={CAMPO_CLASES}
          />
          {errores.telefono ? (
            <p id="telefono-error" className="pl-1 text-sm font-medium text-danger">{errores.telefono}</p>
          ) : (
            <p id="telefono-ayuda" className="pl-1 text-sm text-brand-grape">
              Te enviaremos aquí el código si olvidas tu contraseña.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="usuario" className={ETIQUETA_CLASES}>
            Usuario
          </Label>
          <Input
            id="usuario"
            name="usuario"
            autoComplete="username"
            value={campos.usuario}
            onChange={(event) => actualizarCampo('usuario', event.target.value)}
            aria-invalid={Boolean(errores.usuario)}
            aria-describedby={errores.usuario ? 'usuario-error' : undefined}
            className={CAMPO_CLASES}
            placeholder="Elige un usuario"
          />
          {errores.usuario && (
            <p id="usuario-error" className="pl-1 text-sm font-medium text-danger">{errores.usuario}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contrasena" className={ETIQUETA_CLASES}>
            Contraseña
          </Label>
          <PasswordInput
            id="contrasena"
            name="contrasena"
            autoComplete="new-password"
            value={campos.contrasena}
            onChange={(event) => actualizarCampo('contrasena', event.target.value)}
            aria-invalid={Boolean(errores.contrasena)}
            aria-describedby={errores.contrasena ? 'contrasena-error' : undefined}
            className={CAMPO_CLASES}
            placeholder="Mínimo 8 caracteres"
          />
          {errores.contrasena && (
            <p id="contrasena-error" className="pl-1 text-sm font-medium text-danger">{errores.contrasena}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmar" className={ETIQUETA_CLASES}>
            Confirmar contraseña
          </Label>
          <PasswordInput
            id="confirmar"
            name="confirmar"
            autoComplete="new-password"
            value={campos.confirmar}
            onChange={(event) => actualizarCampo('confirmar', event.target.value)}
            aria-invalid={Boolean(errores.confirmar)}
            aria-describedby={errores.confirmar ? 'confirmar-error' : undefined}
            className={CAMPO_CLASES}
            placeholder="Repite tu contraseña"
          />
          {errores.confirmar && (
            <p id="confirmar-error" className="pl-1 text-sm font-medium text-danger">{errores.confirmar}</p>
          )}
        </div>

        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <Button
            type="submit"
            size="lg"
            disabled={enviando}
            className="order-1 w-full bg-brand-plum text-white hover:bg-brand-grape sm:order-2"
          >
            {enviando ? 'Registrando...' : 'Registrar'}
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="order-2 w-full border-brand-mauve bg-transparent text-brand-night hover:bg-brand-lilac/50 sm:order-1"
          >
            <Link href="/login">Cancelar</Link>
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
