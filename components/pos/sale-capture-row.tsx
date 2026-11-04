'use client';

import { useMemo, useState, type RefObject } from 'react';
import { Minus, Plus, ScanBarcode } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { agruparModelos } from '@/lib/inventario-api';
import { formatMXN } from '@/lib/format';
import type { Articulo } from '@/lib/types';

export function SaleCaptureRow({
  articulos,
  onAgregar,
  inputRef,
}: {
  articulos: Articulo[];
  onAgregar: (articulos: Articulo[]) => void;
  inputRef: RefObject<HTMLInputElement>;
}) {
  const [codigo, setCodigo] = useState('');
  const [modeloCodigo, setModeloCodigo] = useState('');
  const [colorElegido, setColorElegido] = useState('');
  const [cantidadPares, setCantidadPares] = useState(1);
  const [selecciones, setSelecciones] = useState<string[]>(['']);
  const modelos = useMemo(() => agruparModelos(articulos), [articulos]);
  const modeloElegido = modelos.find((modelo) => modelo.codigo === modeloCodigo) ?? null;

  const coloresDisponibles = modeloElegido?.colores ?? [];
  const colorActual = coloresDisponibles.find((c) => c.color === colorElegido) ?? null;
  const tallasDelColor = colorActual?.tallas ?? [];

  function resetPares() {
    setCantidadPares(1);
    setSelecciones(['']);
  }

  function limpiar() {
    setCodigo('');
    setModeloCodigo('');
    setColorElegido('');
    resetPares();
  }

  function elegirModelo(codigoModelo: string) {
    setModeloCodigo(codigoModelo);
    const modelo = modelos.find((m) => m.codigo === codigoModelo);
    if (modelo && modelo.colores.length === 1) {
      setColorElegido(modelo.colores[0].color);
    } else {
      setColorElegido('');
    }
    resetPares();
  }

  function elegirColor(color: string) {
    setColorElegido(color);
    resetPares();
  }

  function cambiarPares(cambio: number) {
    const nuevo = Math.max(1, cantidadPares + cambio);
    setCantidadPares(nuevo);
    setSelecciones((actuales) => {
      const nuevas = [...actuales];
      while (nuevas.length < nuevo) nuevas.push('');
      nuevas.length = nuevo;
      return nuevas;
    });
  }

  function elegirTallaPar(index: number, articuloId: string) {
    setSelecciones((actuales) =>
      actuales.map((id, i) => (i === index ? articuloId : id)),
    );
  }

  function stockDisponible(tallaId: string, currentIndex: number): number {
    const talla = tallasDelColor.find((t) => t.id === tallaId);
    if (!talla) return 0;
    const usadosEnPanel = selecciones.filter(
      (id, i) => i !== currentIndex && id === tallaId,
    ).length;
    return talla.existencias - usadosEnPanel;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const codigoLimpio = codigo.trim();

    if (codigoLimpio) {
      const modelo = modelos.find((item) => item.codigo === codigoLimpio);
      if (!modelo) {
        toast.error('Código no encontrado');
        return;
      }
      if (modelo.colores.length === 1 && modelo.colores[0].tallas.length === 1) {
        onAgregar([modelo.colores[0].tallas[0]]);
        limpiar();
        return;
      }
      setCodigo('');
      elegirModelo(modelo.codigo);
      if (modelo.colores.length > 1) {
        toast.info('Este modelo tiene varios colores. Elige el color y las tallas.');
      } else {
        toast.info('Este modelo tiene varias tallas. Elige las tallas.');
      }
      return;
    }

    if (!modeloElegido) {
      toast.error('Escribe un código o elige un artículo');
      return;
    }
    if (modeloElegido.colores.length > 1 && !colorElegido) {
      toast.error('Elige el color');
      return;
    }

    const sinTalla = selecciones.findIndex((id) => !id);
    if (sinTalla !== -1) {
      toast.error(`Elige la talla del par ${sinTalla + 1}`);
      return;
    }

    const articulosSeleccionados = selecciones
      .map((id) => tallasDelColor.find((t) => t.id === id))
      .filter((a): a is Articulo => a !== undefined);

    if (articulosSeleccionados.length === 0) {
      toast.error('Elige la talla');
      return;
    }

    onAgregar(articulosSeleccionados);
    limpiar();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-lilac sm:p-6"
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,0.8fr)] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="codigo-barras" className="pl-1 text-brand-night">
            Código de barras
          </Label>
          <div className="relative">
            <ScanBarcode
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-plum"
            />
            <Input
              id="codigo-barras"
              ref={inputRef}
              value={codigo}
              onChange={(event) => setCodigo(event.target.value)}
              autoComplete="off"
              autoFocus
              inputMode="numeric"
              placeholder="Escanea o escribe el código"
              className="h-12 border-brand-lilac bg-brand-lilac/40 pl-12 placeholder:text-brand-plum/70 focus-visible:ring-brand-plum"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="articulo" className="pl-1 text-brand-night">
            Artículo
          </Label>
          <Select value={modeloCodigo} onValueChange={elegirModelo}>
            <SelectTrigger
              id="articulo"
              className="h-12 rounded-full border-brand-lilac bg-brand-lilac/40 px-4 text-base focus:ring-brand-plum"
            >
              <SelectValue placeholder="Busca o elige un artículo" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {modelos.map((modelo) => (
                <SelectItem key={modelo.codigo} value={modelo.codigo}>
                  {modelo.descripcion} · {formatMXN(modelo.precio)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="color" className="pl-1 text-brand-night">
            Color
          </Label>
          <Select
            value={colorElegido}
            onValueChange={elegirColor}
            disabled={!modeloElegido || modeloElegido.colores.length <= 1}
          >
            <SelectTrigger
              id="color"
              className="h-12 rounded-full border-brand-lilac bg-brand-lilac/40 px-4 text-base focus:ring-brand-plum"
            >
              <SelectValue
                placeholder={
                  modeloElegido && modeloElegido.colores.length <= 1
                    ? modeloElegido.colores[0]?.color || 'Único'
                    : 'Elige el color'
                }
              />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {coloresDisponibles.map((grupo) => (
                <SelectItem key={grupo.color} value={grupo.color}>
                  {grupo.color || 'Sin color'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {colorActual && (
        <div className="rounded-2xl bg-brand-mist/60 p-4 ring-1 ring-brand-lilac/60">
          <div className="flex items-center justify-between">
            <Label className="pl-1 text-brand-night">Número de pares</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => cambiarPares(-1)}
                disabled={cantidadPares <= 1}
                className="h-9 w-9 border-brand-plum text-brand-plum hover:bg-brand-lilac/40"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </Button>
              <span className="w-8 text-center text-lg font-semibold tabular-nums text-brand-night">
                {cantidadPares}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => cambiarPares(1)}
                className="h-9 w-9 border-brand-plum text-brand-plum hover:bg-brand-lilac/40"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {selecciones.map((articuloId, index) => (
              <div key={index} className="grid grid-cols-[auto_1fr] items-center gap-3">
                <span className="text-sm font-semibold text-brand-grape">Par {index + 1}</span>
                <Select
                  value={articuloId}
                  onValueChange={(value) => elegirTallaPar(index, value)}
                >
                  <SelectTrigger className="h-10 rounded-full border-brand-lilac bg-white px-4 text-base focus:ring-brand-plum">
                    <SelectValue placeholder="Elige la talla" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {tallasDelColor.map((talla) => {
                      const disp = stockDisponible(talla.id, index);
                      return (
                        <SelectItem
                          key={talla.id}
                          value={talla.id}
                          disabled={disp <= 0}
                        >
                          Talla {talla.talla} · {disp <= 0 ? 'Agotada' : `${disp} disp.`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full gap-2 bg-brand-plum text-white hover:bg-brand-grape"
      >
        {colorActual
          ? `Agregar ${cantidadPares} ${cantidadPares === 1 ? 'par' : 'pares'}`
          : 'Agregar'}
      </Button>
    </form>
  );
}
