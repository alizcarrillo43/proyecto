import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// Duración de la suspensión: la cuenta no puede iniciar sesión mientras esté desactivada.
const BANEO_INDEFINIDO = "876000h";
const SIN_BANEO = "none";

type Solicitante = { sesionValida: boolean; esSuperusuario: boolean };

// Verifica el token del usuario firmado y que sea superusuario activo.
async function verificarSuperusuario(req: Request): Promise<Solicitante> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return { sesionValida: false, esSuperusuario: false };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { sesionValida: false, esSuperusuario: false };

  const { data: perfil, error: errorPerfil } = await supabase
    .from("usuarios")
    .select("rol, activo")
    .eq("id", data.user.id)
    .maybeSingle();
  if (errorPerfil) throw errorPerfil;

  return {
    sesionValida: true,
    esSuperusuario: perfil?.activo === true && perfil?.rol === "superusuario",
  };
}

function validarDatosEmpleado(body: Record<string, unknown>) {
  const nombre = String(body.nombre ?? "").trim();
  const correo = String(body.correo ?? "").trim().toLowerCase();
  const lada = String(body.lada ?? "").trim();
  const telefono = String(body.telefono ?? "").trim();
  const usuario = String(body.usuario ?? "").trim().toLowerCase();
  const contrasenaTemporal = String(body.contrasenaTemporal ?? "");

  if (!nombre || nombre.length > 100) return { error: "datos_invalidos", campo: "nombre" };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return { error: "datos_invalidos", campo: "correo" };
  if (!/^\+[0-9]{1,4}$/.test(lada)) return { error: "datos_invalidos", campo: "lada" };
  if (!/^[0-9]{10}$/.test(telefono)) return { error: "datos_invalidos", campo: "telefono" };
  if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) return { error: "datos_invalidos", campo: "usuario" };
  if (contrasenaTemporal.length < 8) return { error: "datos_invalidos", campo: "contrasenaTemporal" };

  return { nombre, correo, lada, telefono, usuario, contrasenaTemporal };
}

async function crearEmpleado(body: Record<string, unknown>) {
  const datos = validarDatosEmpleado(body);
  if ("error" in datos) return json(datos, 400);

  const { data: usuarioExistente, error: errorUsuario } = await supabase
    .from("usuarios")
    .select("id")
    .eq("usuario", datos.usuario)
    .maybeSingle();
  if (errorUsuario) throw errorUsuario;
  if (usuarioExistente) return json({ error: "usuario_existe" }, 409);

  const { data: telefonoExistente, error: errorTelefono } = await supabase
    .from("usuarios")
    .select("id")
    .eq("telefono", datos.telefono)
    .maybeSingle();
  if (errorTelefono) throw errorTelefono;
  if (telefonoExistente) return json({ error: "telefono_existe" }, 409);

  const { data: creada, error: errorCuenta } = await supabase.auth.admin.createUser({
    email: `${datos.usuario}@pasofirme.app`,
    password: datos.contrasenaTemporal,
    email_confirm: true,
  });
  if (errorCuenta || !creada.user) {
    if (errorCuenta?.code === "email_exists" || errorCuenta?.code === "user_already_exists") {
      return json({ error: "usuario_existe" }, 409);
    }
    throw errorCuenta ?? new Error("No se creó la cuenta");
  }

  const { error: errorPerfil } = await supabase.from("usuarios").insert({
    id: creada.user.id,
    nombre: datos.nombre,
    correo: datos.correo,
    lada: datos.lada,
    telefono: datos.telefono,
    usuario: datos.usuario,
    rol: "empleado",
    activo: true,
    debe_cambiar_contrasena: true,
  });
  if (errorPerfil) {
    await supabase.auth.admin.deleteUser(creada.user.id);
    if (errorPerfil.code === "23505") {
      return json({ error: errorPerfil.message.includes("telefono") ? "telefono_existe" : "usuario_existe" }, 409);
    }
    throw errorPerfil;
  }

  return json({ ok: true, id: creada.user.id }, 201);
}

// Obtiene un empleado; los superusuarios no se pueden desactivar ni restablecer desde aquí.
async function buscarEmpleado(usuarioId: string) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, rol, activo")
    .eq("id", usuarioId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.rol !== "empleado") return null;
  return data;
}

async function cambiarEstado(usuarioId: string, activar: boolean) {
  const empleado = await buscarEmpleado(usuarioId);
  if (!empleado) return json({ error: "empleado_no_encontrado" }, 404);

  const { error: errorPerfil } = await supabase
    .from("usuarios")
    .update({ activo: activar })
    .eq("id", usuarioId);
  if (errorPerfil) throw errorPerfil;

  const { error: errorBaneo } = await supabase.auth.admin.updateUserById(usuarioId, {
    ban_duration: activar ? SIN_BANEO : BANEO_INDEFINIDO,
  });
  if (errorBaneo) throw errorBaneo;

  return json({ ok: true });
}

async function restablecerContrasena(usuarioId: string, contrasenaTemporal: string) {
  if (contrasenaTemporal.length < 8) {
    return json({ error: "datos_invalidos", campo: "contrasenaTemporal" }, 400);
  }

  const empleado = await buscarEmpleado(usuarioId);
  if (!empleado) return json({ error: "empleado_no_encontrado" }, 404);

  const { error: errorClave } = await supabase.auth.admin.updateUserById(usuarioId, {
    password: contrasenaTemporal,
  });
  if (errorClave) throw errorClave;

  const { error: errorPerfil } = await supabase
    .from("usuarios")
    .update({ debe_cambiar_contrasena: true })
    .eq("id", usuarioId);
  if (errorPerfil) throw errorPerfil;

  return json({ ok: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "metodo_no_permitido" }, 405);

    const solicitante = await verificarSuperusuario(req);
    if (!solicitante.sesionValida) return json({ error: "no_autenticado" }, 401);
    if (!solicitante.esSuperusuario) return json({ error: "no_autorizado" }, 403);

    const body = (await req.json()) as Record<string, unknown>;
    const accion = String(body?.accion ?? "");
    const usuarioId = String(body?.usuarioId ?? "");

    if (accion === "crear") return await crearEmpleado(body);

    if (!/^[0-9a-f-]{36}$/i.test(usuarioId)) {
      return json({ error: "datos_invalidos", campo: "usuarioId" }, 400);
    }

    if (accion === "desactivar") return await cambiarEstado(usuarioId, false);
    if (accion === "activar") return await cambiarEstado(usuarioId, true);
    if (accion === "restablecer") {
      return await restablecerContrasena(usuarioId, String(body?.contrasenaTemporal ?? ""));
    }

    return json({ error: "accion_no_valida" }, 400);
  } catch (err) {
    console.error("gestion-empleados", err);
    return json({ error: "error_interno" }, 500);
  }
});
