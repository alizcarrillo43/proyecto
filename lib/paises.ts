export const PAISES = [
  { iso: 'MX', nombre: 'México', lada: '+52' },
  { iso: 'US', nombre: 'Estados Unidos', lada: '+1' },
  { iso: 'CA', nombre: 'Canadá', lada: '+1' },
  { iso: 'GT', nombre: 'Guatemala', lada: '+502' },
  { iso: 'SV', nombre: 'El Salvador', lada: '+503' },
  { iso: 'HN', nombre: 'Honduras', lada: '+504' },
  { iso: 'CO', nombre: 'Colombia', lada: '+57' },
  { iso: 'AR', nombre: 'Argentina', lada: '+54' },
  { iso: 'CL', nombre: 'Chile', lada: '+56' },
  { iso: 'ES', nombre: 'España', lada: '+34' },
] as const;

export const LADA_POR_DEFECTO = '+52';

export function banderaDePais(iso: string) {
  return String.fromCodePoint(...iso.split('').map((letra) => 127397 + letra.charCodeAt(0)));
}
