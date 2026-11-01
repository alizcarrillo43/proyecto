import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMXN } from '@/lib/format';
import { VENTAS_EJEMPLO } from '@/lib/sample-data';

export default function HistorialPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-brand-night">Historial de ventas</h1>
        <p className="mt-1 text-brand-grape">Ventas cobradas más recientes.</p>
      </header>

      {VENTAS_EJEMPLO.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-brand-mauve bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-brand-night">Aún no hay ventas</p>
          <p className="mt-1 text-brand-grape">Cobra una venta desde la pantalla de inicio para verla aquí.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-brand-lilac">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-brand-lilac hover:bg-brand-lilac">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-12 px-4 text-brand-night">Folio</TableHead>
                  <TableHead className="h-12 px-4 text-brand-night">Fecha</TableHead>
                  <TableHead className="h-12 px-4 text-brand-night">Vendedor</TableHead>
                  <TableHead className="h-12 px-4 text-right text-brand-night">Artículos</TableHead>
                  <TableHead className="h-12 px-4 text-right text-brand-night">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {VENTAS_EJEMPLO.map((venta) => (
                  <TableRow key={venta.folio} className="border-brand-lilac/60">
                    <TableCell className="px-4 py-4 font-semibold text-brand-night tabular-nums">{venta.folio}</TableCell>
                    <TableCell className="px-4 py-4 tabular-nums">{venta.fecha}</TableCell>
                    <TableCell className="px-4 py-4">{venta.vendedor}</TableCell>
                    <TableCell className="px-4 py-4 text-right tabular-nums">{venta.piezas}</TableCell>
                    <TableCell className="px-4 py-4 text-right font-semibold tabular-nums text-brand-night">
                      {formatMXN(venta.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
