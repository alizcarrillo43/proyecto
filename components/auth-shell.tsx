import { Footprints } from 'lucide-react';

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-night px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-plum/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-brand-lavender/20 blur-3xl"
      />

      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-[2rem] bg-brand-mist p-8 shadow-2xl sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-lavender text-brand-night shadow-md">
            <Footprints className="h-8 w-8" strokeWidth={2.25} aria-hidden />
          </div>
          <p className="text-2xl font-bold tracking-tight text-brand-night">
            Paso Firme
          </p>
          <h1 className="mt-6 text-3xl font-bold leading-[1.2] text-brand-night">
            {title}
          </h1>
          <p className="mt-1 text-base text-brand-grape">{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
