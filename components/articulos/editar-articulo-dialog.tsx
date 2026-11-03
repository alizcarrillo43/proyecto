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
import { actualizarArticulo } from '@/lib/inventario-api';
import type { Articulo } from '@/lib/types';

const CAMPO_CLASES = 'h-12 border-brand-lilac focus-visible:ring-brand-plum';
const ETIQUETA_CLASES = 'pl-1 text-brand-night';

type Campos = {
  descripcion: string;
  precio: string;
  agregar: string;
};
type Errores = Partial<Record<keyof Campos, string>>;

function camposDesde(articulo: Articulo): Campos {
  return {
    descripcion: articulo.descripcion,
    precio: String(articulo.precio),
    agregar: '0',
  };
}

function validar(campos: Campos): Errores {
  const errores: Errores = {};
  if (!campos.descripcion.trim()) errores.descripcion = 'Escribe la descripción del artículo';
  const precio = Number(campos.precio);
  if (!campos.precio.trim() || !Number.isFinite(precio) || precio <= 0) {
    errores.precio = 'Escribe un precio mayor a 0';
  }
  const agregar = Number(campos.agregar);
  if (!/^[0-9]+$/.test(campos.agregar.trim()) || !Number.isInteger(agregar)) {
    errores.agregar = 'Escribe un número entero, sin signo menos';
  }
  return errores;
}

export function EditarArticuloDialog({
  articulo,
  onOpenChange,
  onGuardado,
}: {
  articulo: Articulo | null;
  onOpenChange: (open: boolean) => void;
  onGuardado: () => void;
}) {
  return (
    <Dialog open={articulo !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-brand-lilac bg-brand-mist p-6 sm:p-8">
        {articulo && (
          <FormularioEdicion
            key={articulo.id}
            articulo={articulo}
            onCancelar={() => onOpenChange(false)}
            onGuardado={() => {
              onOpenChange(false);
              onGuardado();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormularioEdicion({
  articulo,
  onCancelar,
  onGuardado,
}: {
  articulo: Articulo;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [campos, setCampos] = useState<Campos>(() => camposDesde(articulo));
  const [errores, setErrores] = useState<Errores>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const agregar = Number(campos.agregar) || 0;
  const existenciasFinales = articulo.existencias + agregar;

  function actualizarCampo(campo: keyof Campos, valor: string) {
    setCampos((actuales) => ({ ...actuales, [campo]: valor }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const erroresLocales = validar(campos);
    setErrores(erroresLocales);
    if (Object.keys(erroresLocales).length > 0) return;

    setGuardando(true);
    const resultado = await actualizarArticulo(articulo.id, {
      descripcion: campos.descripcion.trim(),
      precio: Number(campos.precio),
      existencias: existenciasFinales,
    });
    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    onGuardado();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-brand-night">Editar artículo</DialogTitle>
        <DialogDescription className="text-brand-grape">
          {`Talla ${articulo.talla} · Código ${articulo.codigo}`}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && (
          <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="editar-descripcion" className={ETIQUETA_CLASES}>Descripción</Label>
          <Input
            id="editar-descripcion"
            value={campos.descripcion}
            onChange={(event) => actualizarCampo('descripcion', event.target.value)}
            aria-invalid={Boolean(errores.descripcion)}
            className={CAMPO_CLASES}
          />
          {errores.descripcion && <p className="pl-1 text-sm font-medium text-danger">{errores.descripcion}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="editar-precio" className={ETIQUETA_CLASES}>Precio</Label>
          <Input
            id="editar-precio"
            inputMode="decimal"
            value={campos.precio}
            onChange={(event) => actualizarCampo('precio', event.target.value)}
            aria-invalid={Boolean(errores.precio)}
            className={CAMPO_CLASES}
          />
          {errores.precio && <p className="pl-1 text-sm font-medium text-danger">{errores.precio}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="editar-agregar" className={ETIQUETA_CLASES}>Agregar piezas al inventario</Label>
          <Input
            id="editar-agregar"
            inputMode="numeric"
            value={campos.agregar}
            onChange={(event) => actualizarCampo('agregar', event.target.value)}
            aria-invalid={Boolean(errores.agregar)}
            className={CAMPO_CLASES}
          />
          {errores.agregar && <p className="pl-1 text-sm font-medium text-danger">{errores.agregar}</p>}
          <p className="pl-1 text-sm text-brand-grape">
            Hay {articulo.existencias} pares ahora. Quedarán {existenciasFinales}.
          </p>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onCancelar}
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
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
