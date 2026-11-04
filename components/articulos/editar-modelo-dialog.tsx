'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
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
import { actualizarColorModelo, actualizarModelo } from '@/lib/inventario-api';
import type { ModeloArticulo } from '@/lib/types';

const CAMPO_CLASES = 'h-12 border-brand-lilac focus-visible:ring-brand-plum';
const ETIQUETA_CLASES = 'pl-1 text-brand-night';

type Campos = {
  descripcion: string;
  precio: string;
};
type Errores = Partial<Record<keyof Campos, string>>;

function camposDesde(modelo: ModeloArticulo): Campos {
  return {
    descripcion: modelo.descripcion,
    precio: String(modelo.precio),
  };
}

function validar(campos: Campos): Errores {
  const errores: Errores = {};
  if (!campos.descripcion.trim()) errores.descripcion = 'Escribe la descripción del modelo';
  const precio = Number(campos.precio);
  if (!campos.precio.trim() || !Number.isFinite(precio) || precio <= 0) {
    errores.precio = 'Escribe un precio mayor a 0';
  }
  return errores;
}

export function EditarModeloDialog({
  modelo,
  onOpenChange,
  onGuardado,
}: {
  modelo: ModeloArticulo | null;
  onOpenChange: (open: boolean) => void;
  onGuardado: () => void;
}) {
  return (
    <Dialog open={modelo !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-3xl border-brand-lilac bg-brand-mist p-6 sm:p-8">
        {modelo && (
          <FormularioEdicionModelo
            key={modelo.codigo}
            modelo={modelo}
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

function FormularioEdicionModelo({
  modelo,
  onCancelar,
  onGuardado,
}: {
  modelo: ModeloArticulo;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [campos, setCampos] = useState<Campos>(() => camposDesde(modelo));
  const [errores, setErrores] = useState<Errores>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const coloresIniciales = modelo.colores.map((c) => c.color);
  const [colores, setColores] = useState<string[]>(coloresIniciales);
  const [errorColorIdx, setErrorColorIdx] = useState<Record<number, string>>({});

  function actualizarCampo(campo: keyof Campos, valor: string) {
    setCampos((actuales) => ({ ...actuales, [campo]: valor }));
  }

  function actualizarColor(index: number, valor: string) {
    setColores((actuales) => actuales.map((c, i) => (i === index ? valor : c)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrorColorIdx({});

    const erroresLocales = validar(campos);
    setErrores(erroresLocales);
    if (Object.keys(erroresLocales).length > 0) return;

    const coloresTrim = colores.map((c) => c.trim());

    const vacios = coloresTrim.findIndex((c) => !c);
    if (vacios !== -1) {
      setErrorColorIdx({ [vacios]: 'Escribe un color' });
      return;
    }

    const vistos = new Map<string, number>();
    let duplicadoIdx = -1;
    for (let i = 0; i < coloresTrim.length; i++) {
      const lower = coloresTrim[i].toLowerCase();
      if (vistos.has(lower)) {
        duplicadoIdx = i;
        break;
      }
      vistos.set(lower, i);
    }
    if (duplicadoIdx !== -1) {
      setErrorColorIdx({ [duplicadoIdx]: 'No puedes repetir el mismo color' });
      return;
    }

    setGuardando(true);

    const resultadoModelo = await actualizarModelo(
      modelo.codigo,
      campos.descripcion.trim(),
      Math.round(Number(campos.precio) * 100) / 100,
    );
    if (!resultadoModelo.ok) {
      setGuardando(false);
      setError(resultadoModelo.error);
      return;
    }

    for (let i = 0; i < coloresIniciales.length; i++) {
      const original = coloresIniciales[i];
      const nuevo = coloresTrim[i];
      if (original === nuevo) continue;

      const resultadoColor = await actualizarColorModelo(modelo.codigo, original, nuevo);
      if (!resultadoColor.ok) {
        setGuardando(false);
        setError(resultadoColor.error);
        return;
      }
    }

    setGuardando(false);
    onGuardado();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-brand-night">Editar modelo</DialogTitle>
        <DialogDescription className="text-brand-grape">
          {`Código ${modelo.codigo} · ${modelo.tallas.length} numeraciones`}
          {modelo.colores.length > 1 && ` · ${modelo.colores.length} colores`}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && (
          <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="editar-modelo-descripcion" className={ETIQUETA_CLASES}>Descripción</Label>
          <Input
            id="editar-modelo-descripcion"
            value={campos.descripcion}
            onChange={(event) => actualizarCampo('descripcion', event.target.value)}
            aria-invalid={Boolean(errores.descripcion)}
            className={CAMPO_CLASES}
          />
          {errores.descripcion && <p className="pl-1 text-sm font-medium text-danger">{errores.descripcion}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="editar-modelo-precio" className={ETIQUETA_CLASES}>Precio</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-brand-plum">
              $
            </span>
            <Input
              id="editar-modelo-precio"
              inputMode="decimal"
              value={campos.precio}
              onChange={(event) => actualizarCampo('precio', event.target.value)}
              aria-invalid={Boolean(errores.precio)}
              className={`${CAMPO_CLASES} pl-9 tabular-nums`}
            />
          </div>
          {errores.precio && <p className="pl-1 text-sm font-medium text-danger">{errores.precio}</p>}
          <p className="pl-1 text-sm text-brand-grape">
            El precio se aplica a todas las tallas y colores de este modelo.
          </p>
        </div>

        {colores.length > 0 && (
          <div className="space-y-2">
            <p className="pl-1 text-sm font-semibold text-brand-night">Colores</p>
            {colores.map((color, index) => (
              <div key={index} className="space-y-1">
                <Input
                  value={color}
                  onChange={(event) => actualizarColor(index, event.target.value)}
                  aria-invalid={Boolean(errorColorIdx[index])}
                  className={CAMPO_CLASES}
                  placeholder="Nombre del color"
                />
                {errorColorIdx[index] && (
                  <p className="pl-1 text-sm font-medium text-danger">{errorColorIdx[index]}</p>
                )}
              </div>
            ))}
            <p className="pl-1 text-xs text-brand-grape">
              Cambia el nombre del color y se actualizarán todas las tallas de ese color.
            </p>
          </div>
        )}

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
            className="w-full gap-2 bg-brand-plum text-white hover:bg-brand-grape sm:w-auto"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
