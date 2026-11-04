'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Footprints, House, Landmark, LogOut, Package, Receipt, Users, type LucideIcon } from 'lucide-react';
import { useSesion } from '@/components/session-provider';
import { cerrarSesion } from '@/lib/auth-api';
import { cn } from '@/lib/utils';
import type { Perfil } from '@/lib/types';

type ItemNavegacion = {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
  roles: Perfil['rol'][];
};

const TODOS: Perfil['rol'][] = ['superusuario', 'empleado'];
const SOLO_SUPERUSUARIO: Perfil['rol'][] = ['superusuario'];

const ITEMS_NAVEGACION: ItemNavegacion[] = [
  { href: '/ventas', etiqueta: 'Inicio', icono: House, roles: TODOS },
  { href: '/historial', etiqueta: 'Ventas', icono: Receipt, roles: SOLO_SUPERUSUARIO },
  { href: '/articulos', etiqueta: 'Artículos', icono: Package, roles: TODOS },
  { href: '/caja', etiqueta: 'Caja', icono: Landmark, roles: TODOS },
  { href: '/turno', etiqueta: 'Mi turno', icono: Landmark, roles: TODOS },
  { href: '/gestion-turnos', etiqueta: 'Turnos', icono: Receipt, roles: SOLO_SUPERUSUARIO },
  { href: '/empleados', etiqueta: 'Empleados', icono: Users, roles: SOLO_SUPERUSUARIO },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { perfil } = useSesion();
  const items = ITEMS_NAVEGACION.filter((item) => perfil && item.roles.includes(perfil.rol));

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-grape px-4 py-6 text-brand-lilac md:flex">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-lavender text-brand-night">
            <Footprints className="h-6 w-6" strokeWidth={2.25} aria-hidden />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Paso Firme</span>
        </div>

        <nav aria-label="Menú principal" className="flex flex-col gap-2">
          {items.map(({ href, etiqueta, icono: Icono }) => {
            const activo = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={activo ? 'page' : undefined}
                className={cn(
                  'flex h-12 items-center gap-3 rounded-full px-4 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lavender',
                  activo
                    ? 'bg-brand-lavender font-semibold text-brand-night'
                    : 'text-brand-lilac hover:bg-brand-plum/60 hover:text-white'
                )}
              >
                <Icono className="h-5 w-5" aria-hidden />
                {etiqueta}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={cerrarSesion}
          className="mt-auto flex h-12 items-center gap-3 rounded-full px-4 text-base font-medium text-brand-lilac transition-colors hover:bg-brand-plum/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lavender"
        >
          <LogOut className="h-5 w-5" aria-hidden />
          Cerrar sesión
        </button>
      </aside>

      <nav
        aria-label="Menú principal"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-brand-mauve/40 bg-brand-grape px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {items.map(({ href, etiqueta, icono: Icono }) => {
          const activo = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={activo ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lavender',
                activo ? 'font-semibold text-brand-lavender' : 'text-brand-lilac'
              )}
            >
              <Icono className="h-6 w-6" aria-hidden />
              {etiqueta}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={cerrarSesion}
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium text-brand-lilac transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lavender"
        >
          <LogOut className="h-6 w-6" aria-hidden />
          Salir
        </button>
      </nav>
    </>
  );
}
