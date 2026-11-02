'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ContrasenaTemporalVisible({ contrasena }: { contrasena: string }) {
  const [copiada, setCopiada] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(contrasena);
      setCopiada(true);
    } catch {
      setCopiada(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-brand-lilac">
      <p className="text-sm text-brand-grape">
        Entrégala en persona. Ya no volveremos a mostrarla.
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xl font-bold tracking-widest text-brand-night">{contrasena}</span>
        <Button
          type="button"
          variant="outline"
          onClick={() => void copiar()}
          className="gap-2 border-brand-mauve bg-white text-brand-night hover:bg-brand-lilac/40"
        >
          {copiada ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copiada ? 'Copiada' : 'Copiar'}
        </Button>
      </div>
    </div>
  );
}
