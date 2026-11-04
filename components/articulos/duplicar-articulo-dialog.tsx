'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';
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
import { crearArticulos, type DatosArticulo } from '@/lib/inventario-api';
import type { ModeloArticulo } from '@/lib/types';

const CAMPO_CLASES = 'h-12 border-brand-lilac focus-visible:ring-brand-plum';

type FilaTalla = { talla: string; existencias: string };

export function DuplicarArticuloDialog({
  modelo,
  onOpenChange,
  onDuplicado,
}: {
  modelo: ModeloArticulo | null;
  onOpenChange: (open: boolean) => void;
  onDuplicado: () => void;
}) {
  return (
    <Dialog open={modelo !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl border-brand-lilac bg-brand-mist p-6 sm:p-8">
        {modelo && (
          <FormularioDuplicar
            key={modelo.codigo}
            modelo={modelo}
            onCancelar={() => onOpenChange(false)}
            onDuplicado={() => {
              onOpenChange(false);
              onDuplicado();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormularioDuplicar({
  modelo,
  onCancelar,
  onDuplicado,
}: {
  modelo: ModeloArticulo;
  onCancelar: () => void;
  onDuplicado: () => void;
}) {
  const tallasUnicas = (() => {
    const vistas = new Set<string>();
    const resultado: { talla: string; existencias: string }[] = [];
    for (const talla of [...modelo.tallas].sort((a, b) =>
      a.talla.localeCompare(b.talla, 'es', { numeric: true }),
    )) {
      if (!vistas.has(talla.talla)) {
        vistas.add(talla.talla);
        resultado.push({ talla: talla.talla, existencias: '0' });
      }
    }
    return resultado;
  })();

  const [color, setColor] = useState('');
  const [filas, setFilas] = useState<FilaTalla[]>(tallasUnicas);
  const [errorColor, setErrorColor] = useState<string | null>(null);
  const [errorFilas, setErrorFilas] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const coloresExistentes = modelo.colores.map((c) => c.color.toLowerCase());

  function actualizarExistencia(index: number, valor: string) {
    setFilas((actuales) =>
      actuales.map((fila, i) => (i === index ? { ...fila, existencias: valor } : fila)),
    );
  }

  function validar(): boolean {
    let ok = true;
    setErrorColor(null);
    setErrorFilas({});

    const colorTrim = color.trim();
    if (!colorTrim) {
      setErrorColor('Escribe el color del nuevo artículo');
      ok = false;
    } else if (coloresExistentes.includes(colorTrim.toLowerCase())) {
      setErrorColor('Ya existe una variante con ese color en este modelo');
      ok = false;
    }

    for (let i = 0; i < filas.length; i++) {
      const existencias = Number(filas[i].existencias);
      if (filas[i].existencias.trim() === '' || !Number.isInteger(existencias) || existencias < 0) {
        setErrorFilas((prev) => ({ ...prev, [i]: 'Escribe un número entero de piezas' }));
        ok = false;
      }
    }

    return ok;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!validar()) return;

    const datos: DatosArticulo[] = filas.map((fila) => ({
      codigo: modelo.codigo,
      descripcion: modelo.descripcion,
      talla: fila.talla,
      precio: modelo.precio,
      existencias: Number(fila.existencias),
      color: color.trim(),
    }));

    setGuardando(true);
    const resultado = await crearArticulos(datos);
    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    onDuplicado();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-brand-night">Duplicar artículo</DialogTitle>
        <DialogDescription className="text-brand-grape">
          {`Mismo código ${modelo.codigo} · ${modelo.descripcion}. Solo captura el color y las piezas por talla.`}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && (
          <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="duplicar-color" className="pl-1 text-brand-night">Color</Label>
          <Input
            id="duplicar-color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            aria-invalid={Boolean(errorColor)}
            placeholder="Por ejemplo: rojo, azul, negro"
            className={CAMPO_CLASES}
          />
          {errorColor && <p className="pl-1 text-sm font-medium text-danger">{errorColor}</p>}
          {modelo.colores.length > 0 && (
            <p className="pl-1 text-xs text-brand-grape">
              Colores existentes: {modelo.colores.map((c) => c.color || 'Sin color').join(', ')}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <p className="pl-1 text-sm font-semibold text-brand-night">Piezas por talla</p>
          <div className="overflow-hidden rounded-2xl ring-1 ring-brand-lilac">
            <table className="w-full text-sm">
              <thead className="bg-brand-lilac/60">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-brand-night">Talla</th>
                  <th className="px-3 py-2 text-right font-semibold text-brand-night">Piezas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-lilac/40 bg-white">
                {filas.map((fila, index) => (
                  <tr key={fila.talla}>
                    <td className="px-3 py-2 font-semibold tabular-nums text-brand-night">{fila.talla}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        value={fila.existencias}
                        onChange={(event) => actualizarExistencia(index, event.target.value)}
                        aria-invalid={Boolean(errorFilas[index])}
                        className="h-10 border-brand-lilac text-right tabular-nums"
                        placeholder="0"
                      />
                      {errorFilas[index] && (
                        <p className="mt-1 text-xs font-medium text-danger">{errorFilas[index]}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            className="w-full gap-2 bg-brand-plum text-white hover:bg-brand-grape sm:w-auto"
          >
            <Copy className="h-4 w-4" aria-hidden />
            {guardando ? 'Guardando...' : 'Duplicar artículo'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
