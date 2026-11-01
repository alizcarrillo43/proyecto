'use client';

import { useState } from 'react';
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
import { CodigoDeBarras } from '@/components/codigo-de-barras';
import { crearArticulo, type DatosArticulo } from '@/lib/inventario-api';
import type { Articulo } from '@/lib/types';

type Campos = { descripcion: string; talla: string; precio: string; existencias: string };
type Errores = Partial<Record<keyof Campos, string>>;

const CAMPOS_VACIOS: Campos = { descripcion: '', talla: '', precio: '', existencias: '' };
const CAMPO_CLASES = 'h-12 border-brand-lilac focus-visible:ring-brand-plum';

function validar(campos: Campos): Errores {
  const errores: Errores = {};
  if (!campos.descripcion.trim()) errores.descripcion = 'Escribe la descripción del artículo';
  if (!campos.talla.trim()) errores.talla = 'Escribe el número o talla';
  const precio = Number(campos.precio);
  if (campos.precio.trim() === '' || !Number.isFinite(precio) || precio < 0) {
    errores.precio = 'Escribe un precio válido';
  }
  const existencias = Number(campos.existencias);
  if (
    campos.existencias.trim() === '' ||
    !Number.isInteger(existencias) ||
    existencias < 0
  ) {
    errores.existencias = 'Escribe las piezas en existencia (número entero)';
  }
  return errores;
}

export function NuevoArticuloDialog({
  open,
  onOpenChange,
  onCreado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreado: (articulo: Articulo) => void;
}) {
  const [campos, setCampos] = useState<Campos>(CAMPOS_VACIOS);
  const [errores, setErrores] = useState<Errores>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [creado, setCreado] = useState<Articulo | null>(null);

  function actualizarCampo(campo: keyof Campos, valor: string) {
    setCampos((actuales) => ({ ...actuales, [campo]: valor }));
  }

  function reiniciar() {
    setCampos(CAMPOS_VACIOS);
    setErrores({});
    setError(null);
    setCreado(null);
  }

  function handleOpenChange(siguiente: boolean) {
    if (!siguiente) reiniciar();
    onOpenChange(siguiente);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const erroresLocales = validar(campos);
    setErrores(erroresLocales);
    if (Object.keys(erroresLocales).length > 0) return;

    const datos: DatosArticulo = {
      descripcion: campos.descripcion.trim(),
      talla: campos.talla.trim(),
      precio: Math.round(Number(campos.precio) * 100) / 100,
      existencias: Number(campos.existencias),
    };

    setGuardando(true);
    const resultado = await crearArticulo(datos);
    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setCreado(resultado.articulo);
    onCreado(resultado.articulo);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-brand-lilac bg-brand-mist p-6 sm:p-8">
        {creado ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-brand-night">
                Artículo guardado
              </DialogTitle>
              <DialogDescription className="text-brand-grape">
                {creado.descripcion} ya está en el catálogo con este código de barras.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 ring-1 ring-brand-lilac">
              <CodigoDeBarras codigo={creado.codigo} />
            </div>

            <DialogFooter className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setCreado(null)}
                className="w-full border-brand-mauve bg-white text-brand-night hover:bg-brand-lilac/40 sm:w-auto"
              >
                Agregar otro
              </Button>
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
              <DialogTitle className="text-2xl font-bold text-brand-night">
                Nuevo artículo
              </DialogTitle>
              <DialogDescription className="text-brand-grape">
                El código de barras se genera automáticamente al guardar.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {error && (
                <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
                  {error}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="articulo-descripcion" className="pl-1 text-brand-night">
                  Descripción
                </Label>
                <Input
                  id="articulo-descripcion"
                  value={campos.descripcion}
                  onChange={(event) => actualizarCampo('descripcion', event.target.value)}
                  aria-invalid={Boolean(errores.descripcion)}
                  placeholder="Por ejemplo: Tenis Runner Pro negro"
                  className={CAMPO_CLASES}
                />
                {errores.descripcion && (
                  <p className="pl-1 text-sm font-medium text-danger">{errores.descripcion}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="articulo-talla" className="pl-1 text-brand-night">
                    Número
                  </Label>
                  <Input
                    id="articulo-talla"
                    value={campos.talla}
                    onChange={(event) => actualizarCampo('talla', event.target.value)}
                    aria-invalid={Boolean(errores.talla)}
                    placeholder="26"
                    className={CAMPO_CLASES}
                  />
                  {errores.talla && (
                    <p className="pl-1 text-sm font-medium text-danger">{errores.talla}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="articulo-existencias" className="pl-1 text-brand-night">
                    Existencias
                  </Label>
                  <Input
                    id="articulo-existencias"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={campos.existencias}
                    onChange={(event) => actualizarCampo('existencias', event.target.value)}
                    aria-invalid={Boolean(errores.existencias)}
                    placeholder="0"
                    className={`${CAMPO_CLASES} tabular-nums`}
                  />
                  {errores.existencias && (
                    <p className="pl-1 text-sm font-medium text-danger">{errores.existencias}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="articulo-precio" className="pl-1 text-brand-night">
                  Precio
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-brand-plum">
                    $
                  </span>
                  <Input
                    id="articulo-precio"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={campos.precio}
                    onChange={(event) => actualizarCampo('precio', event.target.value)}
                    aria-invalid={Boolean(errores.precio)}
                    placeholder="0.00"
                    className={`${CAMPO_CLASES} pl-9 tabular-nums`}
                  />
                </div>
                {errores.precio && (
                  <p className="pl-1 text-sm font-medium text-danger">{errores.precio}</p>
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
                  {guardando ? 'Guardando...' : 'Guardar artículo'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
