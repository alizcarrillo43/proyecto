import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuthBanner({
  tipo = 'error',
  children,
}: {
  tipo?: 'error' | 'exito';
  children: React.ReactNode;
}) {
  const esError = tipo === 'error';
  const Icono = esError ? AlertCircle : CheckCircle2;

  return (
    <div
      role={esError ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300',
        esError
          ? 'border-danger/30 bg-danger-soft text-danger'
          : 'border-success/30 bg-success-soft text-success'
      )}
    >
      <Icono className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}
