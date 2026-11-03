'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
import { crearArticulos, type DatosArticulo } from '@/lib/inventario-api';
import type { Articulo } from '@/lib/types';

type Numeracion = { key: number; talla: string; existencias: string };
type Campos = { descripcion: string; precio: string };
type Errores = { descripcion?: string; precio?: string; numeraciones: Record<number, string> };

const CAMPO_CLASES = 'h-12 border-brand-lilac focus-visible:ring-brand-plum';
const CAMPOS_VACIOS: Campos = { descripcion: '', precio: '' };

function nuevaNumeracion(key: number): Numeracion {
  return { key, talla: '', existencias: '' };
}

function validar(campos: Campos, numeraciones: Numeracion[]): Errores {
  const errores: Errores = { numeraciones: {} };
  if (!campos.descripcion.trim()) errores.descripcion = 'Escribe la descripción del modelo';
  const precio = Number(campos.precio);
  if (campos.precio.trim() === '' || !Number.isFinite(precio) || precio < 0) {
    errores.precio = 'Escribe un precio válido';
  }

  const tallasVistas = new Set<string>();
  for (const numeracion of numeraciones) {
    const talla = numeracion.talla.trim();
    const existencias = Number(numeracion.existencias);
    if (!talla) {
      errores.numeraciones[numeracion.key] = 'Escribe el número o talla';
    } else if (tallasVistas.has(talla)) {
      errores.numeraciones[numeracion.key] = `El número ${talla} ya está en la lista`;
    } else if (numeracion.existencias.trim() === '' || !Number.isInteger(existencias) || existencias < 0) {
      errores.numeraciones[numeracion.key] = 'Escribe las piezas en existencia (número entero)';
    }
    tallasVistas.add(talla);
  }
  return errores;
}

function hayErrores(errores: Errores) {
  return Boolean(errores.descripcion || errores.precio || Object.keys(errores.numeraciones).length > 0);
}

export function NuevoArticuloDialog({
  open,
  onOpenChange,
  onCreado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreado: (articulos: Articulo[]) => void;
}) {
  const [campos, setCampos] = useState<Campos>(CAMPOS_VACIOS);
  const [numeraciones, setNumeraciones] = useState<Numeracion[]>([nuevaNumeracion(0)]);
  const [siguienteKey, setSiguienteKey] = useState(1);
  const [errores, setErrores] = useState<Errores>({ numeraciones: {} });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [creados, setCreados] = useState<Articulo[] | null>(null);

  function reiniciar() {
    setCampos(CAMPOS_VACIOS);
    setNumeraciones([nuevaNumeracion(0)]);
    setSiguienteKey(1);
    setErrores({ numeraciones: {} });
    setError(null);
    setCreados(null);
  }

  function handleOpenChange(siguiente: boolean) {
    if (!siguiente) reiniciar();
    onOpenChange(siguiente);
  }

  function actualizarNumeracion(key: number, campo: 'talla' | 'existencias', valor: string) {
    setNumeraciones((actuales) =>
      actuales.map((item) => (item.key === key ? { ...item, [campo]: valor } : item)),
    );
  }

  function quitarNumeracion(key: number) {
    setNumeraciones((actuales) => actuales.filter((item) => item.key !== key));
  }

  function agregarNumeracion() {
    setNumeraciones((actuales) => [...actuales, nuevaNumeracion(siguienteKey)]);
    setSiguienteKey((actual) => actual + 1);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const erroresLocales = validar(campos, numeraciones);
    setErrores(erroresLocales);
    if (hayErrores(erroresLocales)) return;

    const precio = Math.round(Number(campos.precio) * 100) / 100;
    const datos: DatosArticulo[] = numeraciones.map((numeracion) => ({
      descripcion: campos.descripcion.trim(),
      talla: numeracion.talla.trim(),
      precio,
      existencias: Number(numeracion.existencias),
    }));

    setGuardando(true);
    const resultado = await crearArticulos(datos);
    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setCreados(resultado.articulos);
    onCreado(resultado.articulos);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl border-brand-lilac bg-brand-mist p-6 sm:p-8">
        {creados ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-brand-night">Modelo guardado</DialogTitle>
              <DialogDescription className="text-brand-grape">
                {creados[0]?.descripcion} ya está en el catálogo con sus numeraciones.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 ring-1 ring-brand-lilac">
              <CodigoDeBarras codigo={creados[0].codigo} />
              <p className="text-center text-sm text-brand-grape">
                Un solo código para todas las numeraciones de este modelo.
              </p>
            </div>

            <ul className="grid gap-2">
              {creados.map((articulo) => (
                <li
                  key={articulo.id}
                  className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-brand-lilac"
                >
                  <span className="font-semibold text-brand-night">Número {articulo.talla}</span>
                  <span className="tabular-nums text-brand-grape">{articulo.existencias} pares</span>
                </li>
              ))}
            </ul>

            <DialogFooter className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={reiniciar}
                className="w-full border-brand-mauve bg-white text-brand-night hover:bg-brand-lilac/40 sm:w-auto"
              >
                Agregar otro modelo
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
              <DialogTitle className="text-2xl font-bold text-brand-night">Nuevo modelo</DialogTitle>
              <DialogDescription className="text-brand-grape">
                Captura cada numeración con sus piezas. El código de barras de cada una se genera al guardar.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {error && (
                <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
                  {error}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="articulo-descripcion" className="pl-1 text-brand-night">Descripción del modelo</Label>
                <Input
                  id="articulo-descripcion"
                  value={campos.descripcion}
                  onChange={(event) => setCampos((actuales) => ({ ...actuales, descripcion: event.target.value }))}
                  aria-invalid={Boolean(errores.descripcion)}
                  placeholder="Por ejemplo: Tenis Runner Pro negro"
                  className={CAMPO_CLASES}
                />
                {errores.descripcion && <p className="pl-1 text-sm font-medium text-danger">{errores.descripcion}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="articulo-precio" className="pl-1 text-brand-night">Precio</Label>
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
                    onChange={(event) => setCampos((actuales) => ({ ...actuales, precio: event.target.value }))}
                    aria-invalid={Boolean(errores.precio)}
                    placeholder="0.00"
                    className={`${CAMPO_CLASES} pl-9 tabular-nums`}
                  />
                </div>
                {errores.precio && <p className="pl-1 text-sm font-medium text-danger">{errores.precio}</p>}
              </div>

              <div className="space-y-3">
                <p className="pl-1 text-sm font-semibold text-brand-night">Numeraciones y piezas</p>
                {numeraciones.map((numeracion) => (
                  <div key={numeracion.key} className="space-y-1">
                    <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`talla-${numeracion.key}`} className="pl-1 text-brand-night">Número</Label>
                        <Input
                          id={`talla-${numeracion.key}`}
                          value={numeracion.talla}
                          onChange={(event) => actualizarNumeracion(numeracion.key, 'talla', event.target.value)}
                          aria-invalid={Boolean(errores.numeraciones[numeracion.key])}
                          placeholder="26"
                          className={CAMPO_CLASES}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`existencias-${numeracion.key}`} className="pl-1 text-brand-night">Piezas</Label>
                        <Input
                          id={`existencias-${numeracion.key}`}
                          type="number"
                          inputMode="numeric"
                          min="0"
                          step="1"
                          value={numeracion.existencias}
                          onChange={(event) => actualizarNumeracion(numeracion.key, 'existencias', event.target.value)}
                          aria-invalid={Boolean(errores.numeraciones[numeracion.key])}
                          placeholder="0"
                          className={`${CAMPO_CLASES} tabular-nums`}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => quitarNumeracion(numeracion.key)}
                        disabled={numeraciones.length === 1}
                        aria-label="Quitar numeración"
                        className="h-12 w-12 border-brand-mauve bg-white text-brand-grape hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                    {errores.numeraciones[numeracion.key] && (
                      <p className="pl-1 text-sm font-medium text-danger">{errores.numeraciones[numeracion.key]}</p>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={agregarNumeracion}
                  className="w-full gap-2 border-dashed border-brand-mauve bg-white text-brand-plum hover:bg-brand-lilac/40"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Agregar otra numeración
                </Button>
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
                  {guardando ? 'Guardando...' : 'Guardar modelo'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
