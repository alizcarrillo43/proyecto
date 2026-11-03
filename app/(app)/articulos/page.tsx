'use client';

import { useState } from 'react';
import { Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { EditarArticuloDialog } from '@/components/articulos/editar-articulo-dialog';
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
import { cambiarPausaArticulo } from '@/lib/inventario-api';
import { formatMXN } from '@/lib/format';
import type { Articulo } from '@/lib/types';

export default function ArticulosPage() {
  const { articulos, cargando, error, recargar } = useArticulos();
  const { perfil } = useSesion();
  const puedeAgregar = perfil?.rol === 'superusuario';
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [articuloEditando, setArticuloEditando] = useState<Articulo | null>(null);
  const [articuloEliminando, setArticuloEliminando] = useState<Articulo | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  async function alternarPausa(articulo: Articulo) {
    setErrorAccion(null);
    const resultado = await cambiarPausaArticulo(articulo.id, !articulo.activo);
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
        {puedeAgregar && (
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
      ) : articulos.length === 0 ? (
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
                  <TableHead className="h-12 px-4 text-brand-night">Código de barras</TableHead>
                  <TableHead className="h-12 px-4 text-brand-night">Descripción</TableHead>
                  <TableHead className="h-12 px-4 text-center text-brand-night">Número</TableHead>
                  <TableHead className="h-12 px-4 text-right text-brand-night">Precio</TableHead>
                  <TableHead className="h-12 px-4 text-right text-brand-night">Existencias</TableHead>
                  {puedeAgregar && (
                    <TableHead className="h-12 px-4 text-right text-brand-night">Acciones</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {articulos.map((articulo) => (
                  <TableRow key={articulo.id} className="border-brand-lilac/60">
                    <TableCell className="px-4 py-4 tabular-nums text-brand-grape">{articulo.codigo}</TableCell>
                    <TableCell className="px-4 py-4 font-medium text-brand-night">
                      <div className="flex flex-wrap items-center gap-2">
                        {articulo.descripcion}
                        {!articulo.activo && (
                          <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning">
                            En pausa
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center tabular-nums">{articulo.talla}</TableCell>
                    <TableCell className="px-4 py-4 text-right font-semibold tabular-nums text-brand-night">
                      {formatMXN(articulo.precio)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <span
                        className={
                          articulo.existencias === 0
                            ? 'inline-flex rounded-full bg-danger-soft px-3 py-1 text-sm font-semibold text-danger'
                            : articulo.existencias <= 3
                              ? 'inline-flex rounded-full bg-warning-soft px-3 py-1 text-sm font-semibold text-warning'
                              : 'inline-flex rounded-full bg-success-soft px-3 py-1 text-sm font-semibold text-success'
                        }
                      >
                        {articulo.existencias === 0 ? 'Agotado' : articulo.existencias}
                      </span>
                    </TableCell>
                    {puedeAgregar && (
                      <TableCell className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => void alternarPausa(articulo)}
                            aria-label={articulo.activo ? 'Pausar venta' : 'Reanudar venta'}
                            title={articulo.activo ? 'Pausar venta' : 'Reanudar venta'}
                            className={articulo.activo
                              ? 'h-10 w-10 border-brand-mauve bg-white text-brand-plum hover:bg-brand-lilac/40'
                              : 'h-10 w-10 border-warning/40 bg-white text-warning hover:bg-warning-soft'}
                          >
                            {articulo.activo ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setArticuloEditando(articulo)}
                            className="gap-2 border-brand-mauve bg-white text-brand-night hover:bg-brand-lilac/40"
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setArticuloEliminando(articulo)}
                            className="gap-2 border-danger/40 bg-white text-danger hover:bg-danger-soft"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {puedeAgregar && (
        <>
          <NuevoArticuloDialog
            open={nuevoAbierto}
            onOpenChange={setNuevoAbierto}
            onCreado={() => void recargar()}
          />
          <EditarArticuloDialog
            articulo={articuloEditando}
            onOpenChange={(abierto) => {
              if (!abierto) setArticuloEditando(null);
            }}
            onGuardado={() => void recargar()}
          />
          <EliminarArticuloDialog
            articulo={articuloEliminando}
            onOpenChange={(abierto) => {
              if (!abierto) setArticuloEliminando(null);
            }}
            onEliminado={() => void recargar()}
          />
        </>
      )}
    </div>
  );
}
