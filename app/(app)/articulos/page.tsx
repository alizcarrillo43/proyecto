'use client';

import { useMemo, useState } from 'react';
import { Copy, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { DuplicarArticuloDialog } from '@/components/articulos/duplicar-articulo-dialog';
import { EditarArticuloDialog } from '@/components/articulos/editar-articulo-dialog';
import { EditarModeloDialog } from '@/components/articulos/editar-modelo-dialog';
import { EliminarArticuloDialog } from '@/components/articulos/eliminar-articulo-dialog';
import { NuevoArticuloDialog } from '@/components/articulos/nuevo-articulo-dialog';
import { useSesion } from '@/components/session-provider';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useArticulos } from '@/hooks/use-articulos';
import { agruparModelos, cambiarPausaModelo } from '@/lib/inventario-api';
import { formatMXN } from '@/lib/format';
import type { Articulo, ModeloArticulo } from '@/lib/types';

function TallasExistencias({
  tallas,
  editable,
  onEditar,
}: {
  tallas: Articulo[];
  editable: boolean;
  onEditar: (articulo: Articulo) => void;
}) {
  return (
    <div
      className="grid w-max items-center gap-x-2 gap-y-2 text-center"
      style={{ gridTemplateColumns: `5.5rem repeat(${tallas.length}, minmax(2.75rem, auto))` }}
    >
      <span className="text-left text-xs font-semibold text-brand-grape">#</span>
      {tallas.map((talla) =>
        editable ? (
          <button
            key={talla.id}
            type="button"
            onClick={() => onEditar(talla)}
            aria-label={`Editar existencias de la talla ${talla.talla}`}
            className="rounded-lg bg-brand-lilac/60 px-2 py-1 font-semibold tabular-nums text-brand-night transition-colors hover:bg-brand-lilac"
          >
            {talla.talla}
          </button>
        ) : (
          <span
            key={talla.id}
            className="rounded-lg bg-brand-lilac/60 px-2 py-1 font-semibold tabular-nums text-brand-night"
          >
            {talla.talla}
          </span>
        ),
      )}

      <span className="text-left text-xs font-semibold text-brand-grape">Existencia</span>
      {tallas.map((talla) => (
        <span
          key={talla.id}
          className={
            talla.existencias === 0
              ? 'rounded-lg bg-danger-soft px-2 py-1 font-semibold tabular-nums text-danger'
              : 'px-2 py-1 font-semibold tabular-nums text-brand-night'
          }
        >
          {talla.existencias}
        </span>
      ))}
    </div>
  );
}

function FilasColoresModelo({
  modelo,
  editable,
  onEditar,
}: {
  modelo: ModeloArticulo;
  editable: boolean;
  onEditar: (articulo: Articulo) => void;
}) {
  if (modelo.colores.length <= 1) {
    const color = modelo.colores[0]?.color ?? '';
    return (
      <div className="space-y-2">
        {color && (
          <span className="inline-block rounded-full bg-brand-lavender px-2.5 py-0.5 text-xs font-semibold text-brand-night">
            {color}
          </span>
        )}
        <TallasExistencias tallas={modelo.tallas} editable={editable} onEditar={onEditar} />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {modelo.colores.map((grupo) => (
        <div key={grupo.color} className="space-y-2">
          <span className="inline-block rounded-full bg-brand-lavender px-2.5 py-0.5 text-xs font-semibold text-brand-night">
            {grupo.color || 'Sin color'}
          </span>
          <TallasExistencias tallas={grupo.tallas} editable={editable} onEditar={onEditar} />
        </div>
      ))}
    </div>
  );
}

export default function ArticulosPage() {
  const { articulos, cargando, error, recargar } = useArticulos();
  const { perfil } = useSesion();
  const puedeEditar = perfil?.rol === 'superusuario';
  const modelos = useMemo(() => agruparModelos(articulos), [articulos]);
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [articuloEditando, setArticuloEditando] = useState<Articulo | null>(null);
  const [modeloEditando, setModeloEditando] = useState<ModeloArticulo | null>(null);
  const [modeloDuplicando, setModeloDuplicando] = useState<ModeloArticulo | null>(null);
  const [modeloEliminando, setModeloEliminando] = useState<ModeloArticulo | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  async function alternarPausa(modelo: ModeloArticulo) {
    setErrorAccion(null);
    const resultado = await cambiarPausaModelo(modelo.codigo, modelo.pausado);
    if (!resultado.ok) {
      setErrorAccion(resultado.error);
      return;
    }
    void recargar();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-night">Artículos</h1>
          <p className="mt-1 text-brand-grape">Catálogo y existencias de la tienda.</p>
        </div>
        {puedeEditar && (
          <Button
            type="button"
            size="lg"
            onClick={() => setNuevoAbierto(true)}
            className="gap-2 bg-brand-plum text-white hover:bg-brand-grape"
          >
            <Plus className="h-5 w-5" aria-hidden />
            Nuevo artículo
          </Button>
        )}
      </header>

      {errorAccion && (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {errorAccion}
        </p>
      )}

      {error ? (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          <span>{error}</span>
          <button type="button" onClick={() => void recargar()} className="font-semibold underline underline-offset-4">
            Reintentar
          </button>
        </div>
      ) : cargando ? (
        <p className="py-16 text-center text-brand-grape">Cargando artículos...</p>
      ) : modelos.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-brand-mauve bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-brand-night">Aún no hay artículos</p>
          <p className="mt-1 text-brand-grape">Agrega tu primer artículo para empezar a vender.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-brand-lilac">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-brand-lilac hover:bg-brand-lilac">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-12 px-4 text-brand-night">Código</TableHead>
                  <TableHead className="h-12 px-4 text-brand-night">Descripción</TableHead>
                  <TableHead className="h-12 px-4 text-right text-brand-night">Precio</TableHead>
                  <TableHead className="h-12 px-4 text-brand-night">Existencias por talla</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelos.map((modelo) => (
                  <TableRow key={modelo.codigo} className="border-brand-lilac/60">
                    <TableCell className="px-4 py-4 align-top tabular-nums text-brand-grape">{modelo.codigo}</TableCell>
                    <TableCell className="px-4 py-4 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-brand-night">{modelo.descripcion}</span>
                        {modelo.pausado && (
                          <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning">
                            En pausa
                          </span>
                        )}
                      </div>
                      {puedeEditar && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setModeloEditando(modelo)}
                            className="gap-2 border-brand-plum bg-white text-brand-plum hover:bg-brand-lilac/40"
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setModeloDuplicando(modelo)}
                            className="gap-2 border-brand-plum bg-white text-brand-plum hover:bg-brand-lilac/40"
                          >
                            <Copy className="h-4 w-4" aria-hidden />
                            Duplicar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void alternarPausa(modelo)}
                            className={modelo.pausado
                              ? 'gap-2 border-warning/40 bg-white text-warning hover:bg-warning-soft'
                              : 'gap-2 border-brand-mauve bg-white text-brand-plum hover:bg-brand-lilac/40'}
                          >
                            {modelo.pausado ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
                            {modelo.pausado ? 'Reanudar venta' : 'Pausar venta'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setModeloEliminando(modelo)}
                            className="gap-2 border-danger/40 bg-white text-danger hover:bg-danger-soft"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4 align-top text-right font-semibold tabular-nums text-brand-night">
                      {formatMXN(modelo.precio)}
                    </TableCell>
                    <TableCell className="px-4 py-4 align-top">
                      <FilasColoresModelo modelo={modelo} editable={puedeEditar} onEditar={setArticuloEditando} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {puedeEditar && (
        <>
          <NuevoArticuloDialog
            open={nuevoAbierto}
            onOpenChange={setNuevoAbierto}
            onCreado={() => void recargar()}
          />
          <DuplicarArticuloDialog
            modelo={modeloDuplicando}
            onOpenChange={(abierto) => {
              if (!abierto) setModeloDuplicando(null);
            }}
            onDuplicado={() => void recargar()}
          />
          <EditarModeloDialog
            modelo={modeloEditando}
            onOpenChange={(abierto) => {
              if (!abierto) setModeloEditando(null);
            }}
            onGuardado={() => void recargar()}
          />
          <EditarArticuloDialog
            articulo={articuloEditando}
            onOpenChange={(abierto) => {
              if (!abierto) setArticuloEditando(null);
            }}
            onGuardado={() => void recargar()}
          />
          <EliminarArticuloDialog
            modelo={modeloEliminando}
            onOpenChange={(abierto) => {
              if (!abierto) setModeloEliminando(null);
            }}
            onEliminado={() => void recargar()}
          />
        </>
      )}
    </div>
  );
}
