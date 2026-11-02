'use client';

import { useState } from 'react';
import { KeyRound, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mensajeDeError } from '@/lib/auth-api';
import { gestionarEmpleado } from '@/lib/empleados-api';
import type { Empleado } from '@/lib/types';

export function TablaEmpleados({
  empleados,
  onRestablecer,
  onCambiado,
}: {
  empleados: Empleado[];
  onRestablecer: (empleado: Empleado) => void;
  onCambiado: () => void;
}) {
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cambiarActivo(empleado: Empleado) {
    setError(null);
    setProcesandoId(empleado.id);
    const resultado = await gestionarEmpleado(empleado.activo ? 'desactivar' : 'activar', {
      usuarioId: empleado.id,
    });
    setProcesandoId(null);

    if (!resultado.ok) {
      setError(mensajeDeError(resultado.error));
      return;
    }
    onCambiado();
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-brand-lilac">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-brand-lilac hover:bg-brand-lilac">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-12 px-4 text-brand-night">Nombre</TableHead>
                <TableHead className="h-12 px-4 text-brand-night">Usuario</TableHead>
                <TableHead className="h-12 px-4 text-brand-night">Teléfono</TableHead>
                <TableHead className="h-12 px-4 text-brand-night">Estado</TableHead>
                <TableHead className="h-12 px-4 text-right text-brand-night">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empleados.map((empleado) => {
                const procesando = procesandoId === empleado.id;
                return (
                  <TableRow key={empleado.id} className="border-brand-lilac/60">
                    <TableCell className="px-4 py-4 font-medium text-brand-night">{empleado.nombre}</TableCell>
                    <TableCell className="px-4 py-4 text-brand-grape">{empleado.usuario}</TableCell>
                    <TableCell className="px-4 py-4 tabular-nums text-brand-grape">
                      {empleado.lada} {empleado.telefono}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={
                            empleado.activo
                              ? 'inline-flex rounded-full bg-success-soft px-3 py-1 text-sm font-semibold text-success'
                              : 'inline-flex rounded-full bg-danger-soft px-3 py-1 text-sm font-semibold text-danger'
                          }
                        >
                          {empleado.activo ? 'Activo' : 'Desactivado'}
                        </span>
                        {empleado.debe_cambiar_contrasena && (
                          <span className="inline-flex rounded-full bg-warning-soft px-3 py-1 text-sm font-semibold text-warning">
                            Pendiente de cambio
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={procesando}
                          onClick={() => onRestablecer(empleado)}
                          className="gap-2 border-brand-mauve bg-white text-brand-night hover:bg-brand-lilac/40"
                        >
                          <KeyRound className="h-4 w-4" aria-hidden />
                          Restablecer contraseña
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={procesando}
                          onClick={() => void cambiarActivo(empleado)}
                          className={
                            empleado.activo
                              ? 'gap-2 border-danger/40 bg-white text-danger hover:bg-danger-soft'
                              : 'gap-2 border-success/40 bg-white text-success hover:bg-success-soft'
                          }
                        >
                          {empleado.activo ? (
                            <PowerOff className="h-4 w-4" aria-hidden />
                          ) : (
                            <Power className="h-4 w-4" aria-hidden />
                          )}
                          {empleado.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
