import { patronEAN13 } from '@/lib/codigo-barras';

export function CodigoDeBarras({ codigo }: { codigo: string }) {
  const barras = patronEAN13(codigo);
  const margen = 10;
  const ancho = barras.length + margen * 2;

  return (
    <svg
      role="img"
      aria-label={`Código de barras ${codigo}`}
      viewBox={`0 0 ${ancho} 120`}
      className="h-auto w-full max-w-xs"
    >
      <rect width={ancho} height="120" fill="#ffffff" />
      {barras.split('').map((bit, indice) =>
        bit === '1' ? (
          <rect key={indice} x={indice + margen} y="6" width="1" height="84" fill="#000000" />
        ) : null,
      )}
      <text
        x={ancho / 2}
        y="111"
        textAnchor="middle"
        fontFamily="monospace"
        fontSize="13"
        letterSpacing="2"
        fill="#000000"
      >
        {codigo}
      </text>
    </svg>
  );
}
