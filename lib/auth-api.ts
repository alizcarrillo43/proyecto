import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from '@/lib/supabase';

export type ResultadoAuth = { ok: true } | { ok: false; error: string; campo?: string };

type RespuestaFuncion = { ok?: boolean; error?: string; campo?: string };

const MENSAJES_ERROR: Record<string, string> = {
  credenciales_invalidas: 'Usuario o contraseña incorrectos. Revisa tus datos e intenta de nuevo.',
  cuenta_desactivada: 'Tu cuenta está desactivada. Pide al dueño de la tienda que la reactive.',
  usuario_existe: 'Ese usuario ya está registrado. Elige otro.',
  telefono_existe: 'Ese teléfono ya tiene una cuenta registrada.',
  datos_invalidos: 'Revisa los datos del formulario.',
  configuracion_no_disponible: 'La configuración inicial ya se completó.',
  no_autenticado: 'Tu sesión venció. Vuelve a iniciar sesión.',
  no_autorizado: 'No tienes permiso para hacer esta acción.',
  empleado_no_encontrado: 'No encontramos a ese empleado. Actualiza la lista e intenta de nuevo.',
  espera_un_minuto: 'Espera un minuto antes de pedir otro código.',
  sms_no_enviado: 'No pudimos enviar el código por SMS. Intenta de nuevo en unos minutos.',
  codigo_incorrecto: 'El código no es correcto. Revísalo e intenta de nuevo.',
  codigo_vencido: 'El código venció o ya no es válido. Pide uno nuevo.',
  demasiados_intentos: 'Hiciste demasiados intentos. Pide un código nuevo.',
  sin_conexion: 'No hay conexión. Revisa tu internet e intenta de nuevo.',
};

export function mensajeDeError(codigo: string) {
  return MENSAJES_ERROR[codigo] ?? 'Algo salió mal. Intenta de nuevo.';
}

export function normalizarUsuario(usuario: string) {
  return usuario.trim().toLowerCase();
}

function correoDeUsuario(usuario: string) {
  return `${normalizarUsuario(usuario)}@pasofirme.app`;
}

export async function llamarFuncion(
  nombre: string,
  cuerpo: Record<string, unknown>,
  token: string = SUPABASE_ANON_KEY,
): Promise<ResultadoAuth> {
  try {
    const respuesta = await fetch(`${SUPABASE_URL}/functions/v1/${nombre}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(cuerpo),
    });
    const datos = (await respuesta.json().catch(() => null)) as RespuestaFuncion | null;
    if (respuesta.ok && datos?.ok === true) return { ok: true };
    return {
      ok: false,
      error: datos?.error ?? 'error_interno',
      campo: datos?.campo,
    };
  } catch {
    return { ok: false, error: 'sin_conexion' };
  }
}

export async function iniciarSesion(usuario: string, contrasena: string): Promise<ResultadoAuth> {
  const { error } = await supabase.auth.signInWithPassword({
    email: correoDeUsuario(usuario),
    password: contrasena,
  });
  if (!error) return { ok: true };
  if (error.status === 0 || error.name === 'AuthRetryableFetchError') {
    return { ok: false, error: 'sin_conexion' };
  }
  if (error.code === 'user_banned' || /banned/i.test(error.message)) {
    return { ok: false, error: 'cuenta_desactivada' };
  }
  return { ok: false, error: 'credenciales_invalidas' };
}

export async function haceFaltaConfiguracion(): Promise<boolean> {
  const { data, error } = await supabase.rpc('hace_falta_configuracion');
  if (error) throw error;
  return data === true;
}

export function crearSuperusuario(datos: {
  nombre: string;
  correo: string;
  lada: string;
  telefono: string;
  usuario: string;
  contrasena: string;
}) {
  return llamarFuncion('configuracion-inicial', {
    ...datos,
    usuario: normalizarUsuario(datos.usuario),
  });
}

export function solicitarCodigo(usuario: string) {
  return llamarFuncion('recuperar-contrasena', {
    accion: 'solicitar',
    usuario: normalizarUsuario(usuario),
  });
}

export function verificarCodigo(usuario: string, codigo: string) {
  return llamarFuncion('recuperar-contrasena', {
    accion: 'verificar',
    usuario: normalizarUsuario(usuario),
    codigo,
  });
}

export function restablecerContrasena(usuario: string, codigo: string, contrasena: string) {
  return llamarFuncion('recuperar-contrasena', {
    accion: 'restablecer',
    usuario: normalizarUsuario(usuario),
    codigo,
    contrasena,
  });
}

export async function cambiarContrasenaPropia(nueva: string): Promise<ResultadoAuth> {
  const { error } = await supabase.auth.updateUser({ password: nueva });
  if (error) return { ok: false, error: 'datos_invalidos', campo: 'contrasena' };

  const { error: errorMarca } = await supabase.rpc('completar_cambio_contrasena');
  if (errorMarca) return { ok: false, error: 'sin_conexion' };
  return { ok: true };
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
}
