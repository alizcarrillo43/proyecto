import { CajaInicialCard } from '@/components/caja/caja-inicial-card';

export default function CajaPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-brand-night">Caja</h1>
        <p className="mt-1 text-brand-grape">Fondo inicial y efectivo del turno abierto.</p>
      </header>
      <CajaInicialCard />
    </div>
  );
}
