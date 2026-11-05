import { supabase } from './supabase'

export type EstadoTurno = 'abierto' | 'cerrado'

export type Turno = {
  id: string
  empleadoId: string
  empleadoNombre: string
  estado: EstadoTurno
  fechaApertura: string
  fechaCierre: string | null
  fondoInicial: number
  efectivoContado: number | null
  diferencia: number | null
  cierreForzado: boolean
  motivoCierreForzado: string | null
}

export type DiaTurno = {
  fecha: string
  numVentas: number
  piezas: number
  totalVendido: number
  totalEfectivo: number
  totalOtros: number
  ajusteEfectivo: number
  cerrado: boolean
}

export type AjusteCorte = {
  id: string
  corteId: string
  monto: number
  motivo: string
  realizadoPor: string
  createdAt: string
}

export type TotalesTurno = {
  diasTrabajados: number
  numVentas: number
  piezas: number
  totalVendido: number
  totalEfectivo: number
  totalTarjeta: number
  totalTransferencia: number
  ajusteEfectivo: number
  efectivoAEntregar: number
}

export type DetalleTurno = {
  turno: Turno
  dias: DiaTurno[]
  ajustes: AjusteCorte[]
  totales: TotalesTurno
}

export type ArticuloCorte = {
  descripcion: string
  talla: string
  cantidad: number
  importe: number
}

export type CorteDelDia = {
  fecha: string
  cerrado: boolean
  numVentas: number
  piezas: number
  totalVendido: number
  porMetodo: { efectivo: number; tarjeta: number; transferencia: number }
  ajusteEfectivo: number
  articulos: ArticuloCorte[]
}

export type TurnoListado = {
  id: string
  empleadoId: string
  empleadoNombre: string
  estado: EstadoTurno
  fechaApertura: string
  fechaCierre: string | null
  fondoInicial: number
  efectivoContado: number | null
  diferencia: number | null
  cierreForzado: boolean
  motivoCierreForzado: string | null
  totalVendido: number
  totalEfectivo: number
  diasTrabajados: number
}

export type EmpleadoTurno = { id: string; nombre: string }

export type Resultado<T> = { ok: true; data: T } | { ok: false; error: string }

type Json = Record<string, unknown>

const MENSAJE_SIN_PERMISO = 'No tienes permiso para realizar esta acción.'
const MENSAJE_GENERICO = 'No se pudo completar la operación. Intenta de nuevo.'

const MENSAJES_TURNO: Record<string, string> = {
  sin_turno_abierto: 'No tienes un turno abierto. Pide al encargado que lo abra para poder vender.',
  dia_cerrado: 'El corte de hoy ya está cerrado, por eso no se pueden registrar más ventas hoy.',
  turno_ya_abierto: 'Este empleado ya tiene un turno abierto.',
  turno_cerrado: 'Este turno ya está cerrado.',
  motivo_requerido: 'Escribe un motivo de al menos 10 caracteres.',
  fondo_invalido: 'El fondo inicial debe ser un monto válido, igual o mayor a 0.',
  efectivo_invalido: 'Ingresa el efectivo contado.',
  monto_invalido: 'El ajuste debe ser un monto distinto de 0 y dentro del límite permitido.',
  empleado_invalido: 'Elige un empleado activo para abrir el turno.',
  turno_no_existe: 'No encontramos ese turno. Actualiza la pantalla.',
  corte_no_existe: 'No encontramos ese corte. Actualiza la pantalla.',
  fecha_invalida: 'La fecha seleccionada no es válida.',
}

type ErrorSupabase = { code?: string; message?: string }

function mensajeDeError(error: ErrorSupabase): string {
  if (error.code === '42501') return MENSAJE_SIN_PERMISO
  return MENSAJES_TURNO[error.message ?? ''] ?? MENSAJE_GENERICO
}

function esObjeto(valor: unknown): valor is Json {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function aNumero(valor: unknown): number {
  return Number(valor ?? 0)
}

function aNumeroONulo(valor: unknown): number | null {
  return valor === null || valor === undefined ? null : Number(valor)
}

function aTextoONulo(valor: unknown): string | null {
  return typeof valor === 'string' ? valor : null
}

function mapearTurno(raw: Json): Turno {
  return {
    id: String(raw.id),
    empleadoId: String(raw.empleado_id),
    empleadoNombre: String(raw.empleado_nombre ?? ''),
    estado: raw.estado === 'cerrado' ? 'cerrado' : 'abierto',
    fechaApertura: String(raw.fecha_apertura),
    fechaCierre: aTextoONulo(raw.fecha_cierre),
    fondoInicial: aNumero(raw.fondo_inicial),
    efectivoContado: aNumeroONulo(raw.efectivo_contado),
    diferencia: aNumeroONulo(raw.diferencia),
    cierreForzado: raw.cierre_forzado === true,
    motivoCierreForzado: aTextoONulo(raw.motivo_cierre_forzado),
  }
}

function mapearDia(raw: Json): DiaTurno {
  return {
    fecha: aTextoONulo(raw.dia) ?? aTextoONulo(raw.fecha) ?? '',
    numVentas: aNumero(raw.num_ventas),
    piezas: aNumero(raw.piezas),
    totalVendido: aNumero(raw.total_vendido),
    totalEfectivo: aNumero(raw.total_efectivo),
    totalOtros: aNumero(raw.total_otros),
    ajusteEfectivo: aNumero(raw.ajuste_efectivo),
    cerrado: raw.cerrado === true,
  }
}

function mapearDetalle(raw: unknown): DetalleTurno | null {
  if (!esObjeto(raw) || !esObjeto(raw.turno) || !esObjeto(raw.totales)) return null
  const t = raw.totales
  const dias = Array.isArray(raw.dias) ? raw.dias.filter(esObjeto).map(mapearDia) : []
  const ajustes = Array.isArray(raw.ajustes)
    ? raw.ajustes.filter(esObjeto).map((a) => ({
        id: String(a.id),
        corteId: String(a.corte_id),
        monto: aNumero(a.monto),
        motivo: String(a.motivo ?? ''),
        realizadoPor: String(a.realizado_por ?? ''),
        createdAt: String(a.created_at),
      }))
    : []
  return {
    turno: mapearTurno(raw.turno),
    dias,
    ajustes,
    totales: {
      diasTrabajados: aNumero(t.dias_trabajados),
      numVentas: aNumero(t.num_ventas),
      piezas: aNumero(t.piezas),
      totalVendido: aNumero(t.total_vendido),
      totalEfectivo: aNumero(t.total_efectivo),
      totalTarjeta: aNumero(t.total_tarjeta),
      totalTransferencia: aNumero(t.total_transferencia),
      ajusteEfectivo: aNumero(t.ajuste_efectivo),
      efectivoAEntregar: aNumero(t.efectivo_a_entregar),
    },
  }
}

function mapearCorte(raw: unknown): CorteDelDia | null {
  if (!esObjeto(raw)) return null
  const pm = esObjeto(raw.por_metodo) ? raw.por_metodo : {}
  const articulos = Array.isArray(raw.articulos)
    ? raw.articulos.filter(esObjeto).map((a) => ({
        descripcion: String(a.descripcion ?? ''),
        talla: String(a.talla ?? ''),
        cantidad: aNumero(a.cantidad),
        importe: aNumero(a.importe),
      }))
    : []
  return {
    fecha: String(raw.fecha),
    cerrado: raw.cerrado === true,
    numVentas: aNumero(raw.num_ventas),
    piezas: aNumero(raw.piezas),
    totalVendido: aNumero(raw.total_vendido),
    porMetodo: {
      efectivo: aNumero(pm.efectivo),
      tarjeta: aNumero(pm.tarjeta),
      transferencia: aNumero(pm.transferencia),
    },
    ajusteEfectivo: aNumero(raw.ajuste_efectivo),
    articulos,
  }
}

function mapearListado(raw: Json): TurnoListado {
  return {
    ...mapearTurno(raw),
    totalVendido: aNumero(raw.total_vendido),
    totalEfectivo: aNumero(raw.total_efectivo),
    diasTrabajados: aNumero(raw.dias_trabajados),
  }
}

async function ejecutarRpc<T>(
  nombre: string,
  args: Record<string, unknown>,
  leer: (data: unknown) => T | null,
): Promise<Resultado<T>> {
  const { data, error } = await supabase.rpc(nombre, args)
  if (error) return { ok: false, error: mensajeDeError(error) }
  const parseado = leer(data)
  if (parseado === null) return { ok: false, error: MENSAJE_GENERICO }
  return { ok: true, data: parseado }
}

export async function cargarTurnoAbiertoId(): Promise<Resultado<string | null>> {
  const { data, error } = await supabase
    .from('turnos')
    .select('id')
    .eq('estado', 'abierto')
    .maybeSingle()
  if (error) return { ok: false, error: MENSAJE_GENERICO }
  return { ok: true, data: data ? String(data.id) : null }
}

export async function cargarEmpleadosParaTurno(): Promise<Resultado<EmpleadoTurno[]>> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre')
    .eq('rol', 'empleado')
    .eq('activo', true)
    .order('nombre')
  if (error) return { ok: false, error: mensajeDeError(error) }
  return {
    ok: true,
    data: (data ?? []).map((e) => ({ id: String(e.id), nombre: String(e.nombre ?? '') })),
  }
}

export function cargarDetalleTurno(turnoId: string): Promise<Resultado<DetalleTurno>> {
  return ejecutarRpc('detalle_turno', { p_turno_id: turnoId }, mapearDetalle)
}

export function cargarCorteDelDia(turnoId: string, fecha: string): Promise<Resultado<CorteDelDia>> {
  return ejecutarRpc('corte_del_dia', { p_turno_id: turnoId, p_fecha: fecha }, mapearCorte)
}

export function abrirTurno(empleadoId: string, fondoInicial: number): Promise<Resultado<DetalleTurno>> {
  return ejecutarRpc(
    'abrir_turno',
    { p_empleado_id: empleadoId, p_fondo_inicial: fondoInicial },
    mapearDetalle,
  )
}

export function cerrarDia(turnoId: string): Promise<Resultado<DetalleTurno>> {
  return ejecutarRpc('cerrar_dia', { p_turno_id: turnoId }, mapearDetalle)
}

export function cerrarTurno(turnoId: string, efectivoContado: number): Promise<Resultado<DetalleTurno>> {
  return ejecutarRpc(
    'cerrar_turno',
    { p_turno_id: turnoId, p_efectivo_contado: efectivoContado },
    mapearDetalle,
  )
}

export function cerrarTurnoForzado(turnoId: string, motivo: string): Promise<Resultado<DetalleTurno>> {
  return ejecutarRpc(
    'cerrar_turno_forzado',
    { p_turno_id: turnoId, p_motivo: motivo },
    mapearDetalle,
  )
}

export async function ajustarCorte(
  turnoId: string,
  fecha: string,
  monto: number,
  motivo: string,
): Promise<Resultado<null>> {
  const { data: corte, error: errorBusqueda } = await supabase
    .from('cortes_diarios')
    .select('id')
    .eq('turno_id', turnoId)
    .eq('fecha', fecha)
    .maybeSingle()
  if (errorBusqueda) return { ok: false, error: MENSAJE_GENERICO }
  if (!corte) return { ok: false, error: MENSAJES_TURNO.corte_no_existe }

  const { error } = await supabase.rpc('ajustar_corte', {
    p_corte_id: String(corte.id),
    p_monto: monto,
    p_motivo: motivo,
  })
  if (error) return { ok: false, error: mensajeDeError(error) }
  return { ok: true, data: null }
}

export async function listarTurnos(filtros: {
  empleadoId: string | null
  desde: string | null
  hasta: string | null
}): Promise<Resultado<TurnoListado[]>> {
  const { data, error } = await supabase.rpc('listar_turnos', {
    p_empleado_id: filtros.empleadoId,
    p_desde: filtros.desde,
    p_hasta: filtros.hasta,
  })
  if (error) return { ok: false, error: mensajeDeError(error) }
  if (!Array.isArray(data)) return { ok: false, error: MENSAJE_GENERICO }
  return { ok: true, data: data.filter(esObjeto).map(mapearListado) }
}
