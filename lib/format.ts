const formatoMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

export function formatMXN(monto: number) {
  return formatoMoneda.format(monto);
}

const formatoDia = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const formatoFechaHora = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatearDia(fechaIso: string) {
  return formatoDia.format(new Date(`${fechaIso}T00:00:00Z`));
}

export function formatearFechaHora(fecha: string | Date) {
  return formatoFechaHora.format(typeof fecha === 'string' ? new Date(fecha) : fecha);
}

export function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');
}
