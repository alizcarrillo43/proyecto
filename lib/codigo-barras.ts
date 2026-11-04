const PREFIJO_MEXICO = '750';

const PATRON_L = [
  '0001101', '0011001', '0010011', '0111101', '0100011',
  '0110001', '0101111', '0111011', '0110111', '0001011',
];
const PATRON_G = [
  '0100111', '0110011', '0011011', '0100001', '0011101',
  '0111001', '0000101', '0010001', '0001001', '0010111',
];
const PATRON_R = [
  '1110010', '1100110', '1101100', '1000010', '1011100',
  '1001110', '1010000', '1000100', '1001000', '1110100',
];
const SECUENCIA_PARIDAD = [
  'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
  'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL',
];

export function digitoVerificador(base12: string) {
  const suma = base12.split('').reduce(
    (total, digito, indice) => total + Number(digito) * (indice % 2 === 0 ? 1 : 3),
    0,
  );
  return String((10 - (suma % 10)) % 10);
}

export function generarCodigoEAN13() {
  const aleatorios = crypto.getRandomValues(new Uint32Array(9));
  const cuerpo = Array.from(aleatorios, (valor) => String(valor % 10)).join('');
  const base12 = PREFIJO_MEXICO + cuerpo;
  return base12 + digitoVerificador(base12);
}

export function patronEAN13(codigo: string) {
  if (codigo.length !== 13) {
    return codigo
      .split('')
      .map((digito) => `101${PATRON_L[Number(digito)]}0`)
      .join('') + '101';
  }

  const digitos = codigo.split('').map(Number);
  const paridad = SECUENCIA_PARIDAD[digitos[0]];
  const izquierda = digitos.slice(1, 7).map((digito, indice) =>
    paridad[indice] === 'L' ? PATRON_L[digito] : PATRON_G[digito],
  );
  const derecha = digitos.slice(7, 13).map((digito) => PATRON_R[digito]);
  return `101${izquierda.join('')}01010${derecha.join('')}101`;
}
