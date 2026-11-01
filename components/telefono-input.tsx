import { Input } from '@/components/ui/input';
import { PAISES, banderaDePais } from '@/lib/paises';

type TelefonoInputProps = {
  id: string;
  lada: string;
  telefono: string;
  onLadaChange: (lada: string) => void;
  onTelefonoChange: (telefono: string) => void;
  invalido: boolean;
  describedBy?: string;
  campoClases: string;
};

export function TelefonoInput({
  id,
  lada,
  telefono,
  onLadaChange,
  onTelefonoChange,
  invalido,
  describedBy,
  campoClases,
}: TelefonoInputProps) {
  const seleccionPais = PAISES.find((pais) => pais.lada === lada)?.iso ?? PAISES[0].iso;

  return (
    <div className="flex gap-2">
      <select
        aria-label="Código de país"
        value={seleccionPais}
        onChange={(event) => {
          const pais = PAISES.find((item) => item.iso === event.target.value);
          if (pais) onLadaChange(pais.lada);
        }}
        className="h-11 w-[9.5rem] shrink-0 cursor-pointer rounded-md border border-brand-lilac bg-brand-lilac/40 px-3 text-sm font-medium text-brand-night transition-colors hover:bg-brand-lilac/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-plum"
      >
        {PAISES.map((pais) => (
          <option key={pais.iso} value={pais.iso}>
            {`${banderaDePais(pais.iso)} ${pais.iso} ${pais.lada}`}
          </option>
        ))}
      </select>
      <Input
        id={id}
        name="telefono"
        type="tel"
        autoComplete="tel-national"
        inputMode="numeric"
        value={telefono}
        onChange={(event) => onTelefonoChange(event.target.value)}
        aria-invalid={invalido}
        aria-describedby={describedBy}
        className={campoClases}
        placeholder="10 dígitos"
      />
    </div>
  );
}
