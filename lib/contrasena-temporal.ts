const CARACTERES = 'abcdefghjkmnpqrstuvwxyz23456789';

export function generarContrasenaTemporal(longitud = 10) {
  const valores = new Uint32Array(longitud);
  crypto.getRandomValues(valores);
  return Array.from(valores, (valor) => CARACTERES[valor % CARACTERES.length]).join('');
}
