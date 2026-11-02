'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthBanner } from '@/components/auth-banner';
import { AuthShell } from '@/components/auth-shell';
import { PasswordInput } from '@/components/password-input';
import { TelefonoInput } from '@/components/telefono-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  crearSuperusuario,
  haceFaltaConfiguracion,
  iniciarSesion,
  mensajeDeError,
} from '@/lib/auth-api';
import { LADA_POR_DEFECTO } from '@/lib/paises';

const CAMPO_CLASES =
  'border-brand-lilac bg-brand-lilac/40 placeholder:text-brand-plum/70 focus-visible:ring-brand-plum';
const ETIQUETA_CLASES = 'pl-1 text-brand-night';
const USUARIO_REGEX = /^[a-z0-9._-]{3,30}$/;
const CORREO_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Campos = {
  nombre: string;
  correo: string;
  lada: string;
  telefono: string;
  usuario: string;
  contrasena: string;
  confirmar: string;
};
type Errores = Partial<Record<keyof Campos, string>>;

const CAMPOS_VACIOS: Campos = {
  nombre: '',
  correo: '',
  lada: LADA_POR_DEFECTO,
  telefono: '',
  usuario: '',
  contrasena: '',
  confirmar: '',
};

function validar(campos: Campos): Errores {
  const errores: Errores = {};
  if (!campos.nombre.trim()) errores.nombre = 'Escribe tu nombre';
  if (!CORREO_REGEX.test(campos.correo.trim())) errores.correo = 'Escribe un correo válido';
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

export default function ConfiguracionInicialPage() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);
  const [campos, setCampos] = useState<Campos>(CAMPOS_VACIOS);
  const [errores, setErrores] = useState<Errores>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;
    haceFaltaConfiguracion()
      .then((falta) => {
        if (!activo) return;
        if (!falta) router.replace('/login');
        else setVerificando(false);
      })
      .catch(() => {
        if (activo) setError(mensajeDeError('sin_conexion'));
        if (activo) setVerificando(false);
      });
    return () => {
      activo = false;
    };
  }, [router]);

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
    const resultado = await crearSuperusuario({
      nombre: campos.nombre.trim(),
      correo: campos.correo.trim(),
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
    router.replace(acceso.ok ? '/ventas' : '/login');
  }

  if (verificando) {
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

  return (
    <AuthShell title="Primera configuración" subtitle="Crea la cuenta del dueño o gerente">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && <AuthBanner>{error}</AuthBanner>}

        <p className="rounded-2xl bg-brand-lilac/40 px-4 py-3 text-sm text-brand-night">
          Esta cuenta será el superusuario. Solo puede existir una y, después de crearla, esta
          pantalla deja de estar disponible.
        </p>

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
            className={CAMPO_CLASES}
            placeholder="Nombre y apellido"
          />
          {errores.nombre && <p className="pl-1 text-sm font-medium text-danger">{errores.nombre}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="correo" className={ETIQUETA_CLASES}>
            Correo
          </Label>
          <Input
            id="correo"
            name="correo"
            type="email"
            autoComplete="email"
            value={campos.correo}
            onChange={(event) => actualizarCampo('correo', event.target.value)}
            aria-invalid={Boolean(errores.correo)}
            className={CAMPO_CLASES}
            placeholder="correo@ejemplo.com"
          />
          {errores.correo && <p className="pl-1 text-sm font-medium text-danger">{errores.correo}</p>}
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
            campoClases={CAMPO_CLASES}
          />
          {errores.telefono && <p className="pl-1 text-sm font-medium text-danger">{errores.telefono}</p>}
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
            className={CAMPO_CLASES}
            placeholder="Elige un usuario"
          />
          {errores.usuario && <p className="pl-1 text-sm font-medium text-danger">{errores.usuario}</p>}
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
            className={CAMPO_CLASES}
            placeholder="Mínimo 8 caracteres"
          />
          {errores.contrasena && <p className="pl-1 text-sm font-medium text-danger">{errores.contrasena}</p>}
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
            className={CAMPO_CLASES}
            placeholder="Repite tu contraseña"
          />
          {errores.confirmar && <p className="pl-1 text-sm font-medium text-danger">{errores.confirmar}</p>}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={enviando}
          className="w-full bg-brand-plum text-white hover:bg-brand-grape"
        >
          {enviando ? 'Creando cuenta...' : 'Crear superusuario'}
        </Button>
      </form>
    </AuthShell>
  );
}
