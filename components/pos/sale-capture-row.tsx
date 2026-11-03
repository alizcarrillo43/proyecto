'use client';

import { useState, type RefObject } from 'react';
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
  const [articuloId, setArticuloId] = useState('');
  const [tallasDelCodigo, setTallasDelCodigo] = useState<Articulo[]>([]);

  const opciones = tallasDelCodigo.length > 0 ? tallasDelCodigo : articulos;

  function agregar(articulo: Articulo) {
    onAgregar(articulo);
    setCodigo('');
    setArticuloId('');
    setTallasDelCodigo([]);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const codigoLimpio = codigo.trim();

    if (codigoLimpio) {
      const coincidencias = articulos.filter((item) => item.codigo === codigoLimpio);
      if (coincidencias.length === 0) {
        toast.error('Código no encontrado');
        return;
      }
      if (coincidencias.length === 1) {
        agregar(coincidencias[0]);
        return;
      }
      setTallasDelCodigo(coincidencias);
      setArticuloId('');
      setCodigo('');
      toast.info('Este modelo tiene varias tallas. Elige la tuya.');
      return;
    }

    const articulo = opciones.find((item) => item.id === articuloId);
    if (!articulo) {
      toast.error('Escribe un código o elige un artículo');
      return;
    }
    agregar(articulo);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-lilac sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] md:items-end"
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
        <Select value={articuloId} onValueChange={setArticuloId}>
          <SelectTrigger
            id="articulo"
            className="h-12 rounded-full border-brand-lilac bg-brand-lilac/40 px-4 text-base focus:ring-brand-plum"
          >
            <SelectValue placeholder="Busca o elige un artículo" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {opciones.map((articulo) => (
              <SelectItem key={articulo.id} value={articulo.id}>
                {articulo.descripcion} · Talla {articulo.talla} ·{' '}
                {formatMXN(articulo.precio)}
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
