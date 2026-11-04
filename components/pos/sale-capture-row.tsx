'use client';

import { useMemo, useState, type RefObject } from 'react';
import { ScanBarcode } from 'lucide-react';
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
  onAgregar: (articulo: Articulo) => void;
  inputRef: RefObject<HTMLInputElement>;
}) {
  const [codigo, setCodigo] = useState('');
  const [modeloCodigo, setModeloCodigo] = useState('');
  const [colorElegido, setColorElegido] = useState('');
  const [articuloId, setArticuloId] = useState('');
  const modelos = useMemo(() => agruparModelos(articulos), [articulos]);
  const modeloElegido = modelos.find((modelo) => modelo.codigo === modeloCodigo) ?? null;

  const coloresDisponibles = modeloElegido?.colores ?? [];
  const colorActual = coloresDisponibles.find((c) => c.color === colorElegido) ?? null;
  const tallasDelColor = colorActual?.tallas ?? [];

  function limpiar() {
    setCodigo('');
    setModeloCodigo('');
    setColorElegido('');
    setArticuloId('');
  }

  function agregar(articulo: Articulo) {
    onAgregar(articulo);
    limpiar();
  }

  function elegirModelo(codigoModelo: string) {
    setModeloCodigo(codigoModelo);
    setColorElegido('');
    setArticuloId('');
  }

  function elegirColor(color: string) {
    setColorElegido(color);
    setArticuloId('');
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
        agregar(modelo.colores[0].tallas[0]);
        return;
      }
      setCodigo('');
      elegirModelo(modelo.codigo);
      if (modelo.colores.length > 1) {
        toast.info('Este modelo tiene varios colores. Elige el color y la talla.');
      } else {
        toast.info('Este modelo tiene varias tallas. Elige la talla.');
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
    const articulo = tallasDelColor.find((talla) => talla.id === articuloId);
    if (!articulo) {
      toast.error('Elige la talla');
      return;
    }
    agregar(articulo);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-lilac sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] md:items-end"
    >
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
            <SelectValue placeholder={modeloElegido && modeloElegido.colores.length <= 1
              ? (modeloElegido.colores[0]?.color || 'Único')
              : 'Elige el color'} />
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

      <div className="space-y-2">
        <Label htmlFor="talla" className="pl-1 text-brand-night">
          Talla
        </Label>
        <Select
          value={articuloId}
          onValueChange={setArticuloId}
          disabled={!colorActual}
        >
          <SelectTrigger
            id="talla"
            className="h-12 rounded-full border-brand-lilac bg-brand-lilac/40 px-4 text-base focus:ring-brand-plum"
          >
            <SelectValue placeholder="Elige la talla" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {tallasDelColor.map((talla) => (
              <SelectItem key={talla.id} value={talla.id} disabled={talla.existencias <= 0}>
                Talla {talla.talla} · {talla.existencias <= 0 ? 'Agotada' : `${talla.existencias} disp.`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" size="lg" className="h-12 w-full bg-brand-plum px-8 text-white hover:bg-brand-grape md:w-auto">
        Agregar
      </Button>
    </form>
  );
}
