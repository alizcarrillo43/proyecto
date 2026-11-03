'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMXN, formatearFechaHora } from '@/lib/format';
import { cargarEmpleadosParaTurno, listarTurnos, type EmpleadoTurno, type TurnoListado } from '@/lib/turnos-api';

export const DIAS_ALERTA_TURNO = 7;
const TODOS = 'todos';

export function turnosAbiertosLargos(turnos: TurnoListado[], ahora: Date): TurnoListado[] {
  const limite = ahora.getTime() - DIAS_ALERTA_TURNO * 24 * 60 * 60 * 1000;
  return turnos.filter(
    (turno) => turno.estado === 'abierto' && new Date(turno.fechaApertura).getTime() < limite,
  );
}

function diasAbierto(fechaApertura: string, ahora: Date) {
  return Math.floor((ahora.getTime() - new Date(fechaApertura).getTime()) / (24 * 60 * 60 * 1000));
}

export function TurnosDuenoView({ onVerTurno }: { onVerTurno: (turnoId: string) => void }) {
  const [empleados, setEmpleados] = useState<EmpleadoTurno[]>([]);
  const [turnos, setTurnos] = useState<TurnoListado[]>([]);
  const [turnosAbiertos, setTurnosAbiertos] = useState<TurnoListado[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [filtroEmpleado, setFiltroEmpleado] = useState(TODOS);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [version, setVersion] = useState(0);
  const [ahora] = useState(() => new Date());

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);
    Promise.all([
      cargarEmpleadosParaTurno(),
      listarTurnos({
        empleadoId: filtroEmpleado === TODOS ? null : filtroEmpleado,
        desde: desde || null,
        hasta: hasta || null,
      }),
      listarTurnos({ empleadoId: null, desde: null, hasta: null }),
    ]).then(([resEmpleados, resTurnos, resTodos]) => {
      if (!vigente) return;
      setCargando(false);
      if (!resEmpleados.ok || !resTurnos.ok || !resTodos.ok) {
        setError(
          (!resEmpleados.ok && resEmpleados.error) ||
            (!resTurnos.ok && resTurnos.error) ||
            (!resTodos.ok && resTodos.error) ||
            'No pudimos cargar los turnos.',
        );
        return;
      }
      setEmpleados(resEmpleados.data);
      setTurnos(resTurnos.data);
      setTurnosAbiertos(turnosAbiertosLargos(resTodos.data, ahora));
    });
    return () => {
      vigente = false;
    };
  }, [filtroEmpleado, desde, hasta, version, ahora]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-grape">Turnos de caja</p>
        <h1 className="mt-1 text-3xl font-bold text-brand-night">Historial de turnos</h1>
      </header>

      {turnosAbiertos.length > 0 && (
        <section role="alert" className="rounded-3xl bg-danger-soft p-5 text-danger">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div className="space-y-2">
              <p className="font-bold">Turnos abiertos desde hace más de {DIAS_ALERTA_TURNO} días</p>
              <ul className="space-y-1 text-sm">
                {turnosAbiertos.map((turno) => (
                  <li key={turno.id}>
                    <button type="button" onClick={() => onVerTurno(turno.id)} className="font-semibold underline underline-offset-4">
                      {turno.empleadoNombre}
                    </button>{' '}
                    · abierto desde {formatearFechaHora(turno.fechaApertura)} ({diasAbierto(turno.fechaApertura, ahora)} días)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 rounded-3xl border border-brand-lilac bg-white p-6 shadow-sm md:grid-cols-4">
        <div className="space-y-2">
          <Label className="text-brand-night">Empleado</Label>
          <Select value={filtroEmpleado} onValueChange={setFiltroEmpleado}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {empleados.map((empleado) => (
                <SelectItem key={empleado.id} value={empleado.id}>
                  {empleado.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="desde-turnos" className="text-brand-night">Desde</Label>
          <Input id="desde-turnos" type="date" value={desde} onChange={(evento) => setDesde(evento.target.value)} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hasta-turnos" className="text-brand-night">Hasta</Label>
          <Input id="hasta-turnos" type="date" value={hasta} onChange={(evento) => setHasta(evento.target.value)} className="h-11" />
        </div>
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={() => {
              setFiltroEmpleado(TODOS);
              setDesde('');
              setHasta('');
            }}
            className="h-11 w-full border-brand-plum text-brand-plum hover:bg-brand-lilac/40"
          >
            Limpiar filtros
          </Button>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          <span>{error}</span>
          <Button variant="outline" onClick={() => setVersion((actual) => actual + 1)} className="h-9 border-danger text-danger">
            Reintentar
          </Button>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-brand-lilac bg-white shadow-sm">
        {cargando ? (
          <p className="p-8 text-center text-sm font-medium text-brand-grape" role="status">Cargando turnos...</p>
        ) : turnos.length === 0 ? (
          <p className="p-8 text-center text-sm text-brand-grape">No hay turnos con esos filtros.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-brand-grape">Empleado</TableHead>
                  <TableHead className="text-brand-grape">Apertura</TableHead>
                  <TableHead className="text-brand-grape">Cierre</TableHead>
                  <TableHead className="text-right text-brand-grape">Días</TableHead>
                  <TableHead className="text-right text-brand-grape">Vendido</TableHead>
                  <TableHead className="text-right text-brand-grape">Diferencia</TableHead>
                  <TableHead className="text-brand-grape">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turnos.map((turno) => (
                  <TableRow
                    key={turno.id}
                    onClick={() => onVerTurno(turno.id)}
                    className="cursor-pointer transition-colors hover:bg-brand-mist/60"
                  >
                    <TableCell className="font-semibold text-brand-night">{turno.empleadoNombre}</TableCell>
                    <TableCell className="tabular-nums">{formatearFechaHora(turno.fechaApertura)}</TableCell>
                    <TableCell className="tabular-nums">
                      {turno.fechaCierre ? formatearFechaHora(turno.fechaCierre) : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{turno.diasTrabajados}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatMXN(turno.totalVendido)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {turno.diferencia === null ? '—' : formatMXN(turno.diferencia)}
                    </TableCell>
                    <TableCell>
                      <span className={turno.estado === 'abierto' ? 'rounded-full bg-brand-lavender px-2.5 py-1 text-xs font-semibold text-brand-night' : 'rounded-full bg-brand-mist px-2.5 py-1 text-xs font-semibold text-brand-grape'}>
                        {turno.estado === 'abierto' ? 'Abierto' : turno.cierreForzado ? 'Forzado' : 'Cerrado'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
