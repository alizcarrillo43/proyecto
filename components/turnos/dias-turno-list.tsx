import { formatMXN, formatearDia } from '@/lib/format';
import type { DiaTurno } from '@/lib/turnos-api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function DiasTurnoList({ dias }: { dias: DiaTurno[] }) {
  if (dias.length === 0) {
    return <p className="text-sm text-brand-grape">Todavía no hay ventas en este turno.</p>;
  }

  let acumulado = 0;
  const filas = dias.map((dia) => {
    acumulado += dia.totalVendido;
    return { ...dia, acumulado };
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-brand-grape">Día</TableHead>
            <TableHead className="text-right text-brand-grape">Ventas</TableHead>
            <TableHead className="text-right text-brand-grape">Piezas</TableHead>
            <TableHead className="text-right text-brand-grape">Vendido</TableHead>
            <TableHead className="text-right text-brand-grape">Acumulado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((fila) => (
            <TableRow key={fila.fecha}>
              <TableCell className="font-medium text-brand-night">
                {formatearDia(fila.fecha)}
                {fila.cerrado && (
                  <span className="ml-2 rounded-full bg-brand-lavender px-2 py-0.5 text-xs font-semibold text-brand-night">
                    Corte guardado
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{fila.numVentas}</TableCell>
              <TableCell className="text-right tabular-nums">{fila.piezas}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatMXN(fila.totalVendido)}</TableCell>
              <TableCell className="text-right tabular-nums text-brand-grape">{formatMXN(fila.acumulado)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
