'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ContrasenaTemporalVisible } from '@/components/empleados/contrasena-temporal-visible';
import { PasswordInput } from '@/components/password-input';
import { TelefonoInput } from '@/components/telefono-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mensajeDeError } from '@/lib/auth-api';
import { generarContrasenaTemporal } from '@/lib/contrasena-temporal';
import { gestionarEmpleado } from '@/lib/empleados-api';
import { LADA_POR_DEFECTO } from '@/lib/paises';

const CAMPO_CLASES = 'h-12 border-brand-lilac focus-visible:ring-brand-plum';
const ETIQUETA_CLASES = 'pl-1 text-brand-night';
const USUARIO_REGEX = /^[a-z0-9._-]{3,30}$/;
const CORREO_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Campos = {
  nombre: string;
  correo: string;
  lada: string;
  telefono: string;
  usuario: string;
  contrasenaTemporal: string;
};
type Errores = Partial<Record<keyof Campos, string>>;

function camposIniciales(): Campos {
  return {
    nombre: '',
    correo: '',
    lada: LADA_POR_DEFECTO,
    telefono: '',
    usuario: '',
    contrasenaTemporal: generarContrasenaTemporal(),
  };
}

function validar(campos: Campos): Errores {
  const errores: Errores = {};
  if (!campos.nombre.trim()) errores.nombre = 'Escribe el nombre del empleado';
  if (!CORREO_REGEX.test(campos.correo.trim())) errores.correo = 'Escribe un correo válido';
  if (!/^[0-9]{10}$/.test(campos.telefono.trim())) {
    errores.telefono = 'Escribe un teléfono de 10 dígitos, solo con números';
  }
  if (!USUARIO_REGEX.test(campos.usuario.trim().toLowerCase())) {
    errores.usuario = 'Usa de 3 a 30 letras, números, puntos, guiones o guiones bajos';
  }
  if (campos.contrasenaTemporal.length < 8) errores.contrasenaTemporal = 'Usa al menos 8 caracteres';
  return errores;
}

export function NuevoEmpleadoDialog({
  open,
  onOpenChange,
  onCreado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreado: () => void;
}) {
  const [campos, setCampos] = useState<Campos>(camposIniciales);
  const [errores, setErrores] = useState<Errores>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [creado, setCreado] = useState(false);

  function actualizarCampo(campo: keyof Campos, valor: string) {
    setCampos((actuales) => ({ ...actuales, [campo]: valor }));
  }

  function handleOpenChange(siguiente: boolean) {
    if (!siguiente) {
      setCampos(camposIniciales());
      setErrores({});
      setError(null);
      setCreado(false);
    }
    onOpenChange(siguiente);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const erroresLocales = validar(campos);
    setErrores(erroresLocales);
    if (Object.keys(erroresLocales).length > 0) return;

    setGuardando(true);
    const resultado = await gestionarEmpleado('crear', {
      nombre: campos.nombre.trim(),
      correo: campos.correo.trim(),
      lada: campos.lada,
      telefono: campos.telefono.trim(),
      usuario: campos.usuario.trim().toLowerCase(),
      contrasenaTemporal: campos.contrasenaTemporal,
    });
    setGuardando(false);

    if (!resultado.ok) {
      if (resultado.error === 'usuario_existe') setErrores({ usuario: mensajeDeError(resultado.error) });
      else if (resultado.error === 'telefono_existe') setErrores({ telefono: mensajeDeError(resultado.error) });
      else setError(mensajeDeError(resultado.error));
      return;
    }
    setCreado(true);
    onCreado();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-brand-lilac bg-brand-mist p-6 sm:p-8">
        {creado ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-brand-night">Empleado creado</DialogTitle>
              <DialogDescription className="text-brand-grape">
                {`${campos.nombre.trim()} ya puede entrar con el usuario ${campos.usuario.trim().toLowerCase()}.`}
              </DialogDescription>
            </DialogHeader>
            <ContrasenaTemporalVisible contrasena={campos.contrasenaTemporal} />
            <DialogFooter>
              <Button
                type="button"
                size="lg"
                onClick={() => handleOpenChange(false)}
                className="w-full bg-brand-plum text-white hover:bg-brand-grape sm:w-auto"
              >
                Listo
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-brand-night">Nuevo empleado</DialogTitle>
              <DialogDescription className="text-brand-grape">
                Al entrar por primera vez, el empleado deberá cambiar su contraseña temporal.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {error && (
                <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
                  {error}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="empleado-nombre" className={ETIQUETA_CLASES}>Nombre</Label>
                <Input
                  id="empleado-nombre"
                  value={campos.nombre}
                  onChange={(event) => actualizarCampo('nombre', event.target.value)}
                  aria-invalid={Boolean(errores.nombre)}
                  className={CAMPO_CLASES}
                />
                {errores.nombre && <p className="pl-1 text-sm font-medium text-danger">{errores.nombre}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="empleado-correo" className={ETIQUETA_CLASES}>Correo</Label>
                <Input
                  id="empleado-correo"
                  type="email"
                  value={campos.correo}
                  onChange={(event) => actualizarCampo('correo', event.target.value)}
                  aria-invalid={Boolean(errores.correo)}
                  className={CAMPO_CLASES}
                />
                {errores.correo && <p className="pl-1 text-sm font-medium text-danger">{errores.correo}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="empleado-telefono" className={ETIQUETA_CLASES}>Teléfono</Label>
                <TelefonoInput
                  id="empleado-telefono"
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
                <Label htmlFor="empleado-usuario" className={ETIQUETA_CLASES}>Usuario</Label>
                <Input
                  id="empleado-usuario"
                  value={campos.usuario}
                  onChange={(event) => actualizarCampo('usuario', event.target.value)}
                  aria-invalid={Boolean(errores.usuario)}
                  placeholder="Para iniciar sesión"
                  className={CAMPO_CLASES}
                />
                {errores.usuario && <p className="pl-1 text-sm font-medium text-danger">{errores.usuario}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="empleado-contrasena" className={ETIQUETA_CLASES}>Contraseña temporal</Label>
                <div className="flex gap-2">
                  <PasswordInput
                    id="empleado-contrasena"
                    value={campos.contrasenaTemporal}
                    onChange={(event) => actualizarCampo('contrasenaTemporal', event.target.value)}
                    aria-invalid={Boolean(errores.contrasenaTemporal)}
                    autoComplete="off"
                    className={CAMPO_CLASES}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => actualizarCampo('contrasenaTemporal', generarContrasenaTemporal())}
                    className="h-12 shrink-0 gap-2 border-brand-mauve bg-white text-brand-night hover:bg-brand-lilac/40"
                    aria-label="Generar otra contraseña"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
                {errores.contrasenaTemporal && (
                  <p className="pl-1 text-sm font-medium text-danger">{errores.contrasenaTemporal}</p>
                )}
              </div>

              <DialogFooter className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => handleOpenChange(false)}
                  className="w-full border-brand-mauve bg-white text-brand-night hover:bg-brand-lilac/40 sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={guardando}
                  className="w-full bg-brand-plum text-white hover:bg-brand-grape sm:w-auto"
                >
                  {guardando ? 'Guardando...' : 'Crear empleado'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
