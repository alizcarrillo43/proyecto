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

const VIGENCIA_MS = 10 * 60 * 1000;
const ESPERA_MS = 60 * 1000;
const MAX_INTENTOS = 5;

type Fila = {
  id: string;
  codigo_hash: string;
  intentos: number;
  verificado: boolean;
  expira_at: string;
  created_at: string;
};

async function hashCodigo(usuarioId: string, codigo: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${usuarioId}:${codigo}`),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function generarCodigo() {
  const numero = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return String(numero).padStart(6, "0");
}

async function enviarSms(destino: string, mensaje: string) {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const remitente = Deno.env.get("TWILIO_PHONE_NUMBER");
  if (!sid || !token || !remitente) {
    console.error("sms: faltan credenciales del proveedor");
    return false;
  }

  const respuesta = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: destino, From: remitente, Body: mensaje }),
    },
  );
  if (!respuesta.ok) console.error("sms: respuesta", respuesta.status);
  return respuesta.ok;
}

async function buscarUsuario(usuario: string) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, lada, telefono")
    .eq("usuario", usuario)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function ultimoCodigoActivo(usuarioId: string): Promise<Fila | null> {
  const { data, error } = await supabase
    .from("codigos_recuperacion")
    .select("id, codigo_hash, intentos, verificado, expira_at, created_at")
    .eq("usuario_id", usuarioId)
    .eq("usado", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function vencido(fila: Fila) {
  return new Date(fila.expira_at).getTime() < Date.now();
}

async function solicitar(usuario: string) {
  const perfil = await buscarUsuario(usuario);
  if (!perfil) return json({ ok: true });

  const activo = await ultimoCodigoActivo(perfil.id);
  if (activo && Date.now() - new Date(activo.created_at).getTime() < ESPERA_MS) {
    return json({ error: "espera_un_minuto" }, 429);
  }

  const codigo = generarCodigo();
  const enviado = await enviarSms(
    `${perfil.lada}${perfil.telefono}`,
    `Paso Firme: tu código para restablecer la contraseña es ${codigo}. Vence en 10 minutos.`,
  );
  if (!enviado) return json({ error: "sms_no_enviado" }, 502);

  const { error: errorAnterior } = await supabase
    .from("codigos_recuperacion")
    .update({ usado: true })
    .eq("usuario_id", perfil.id)
    .eq("usado", false);
  if (errorAnterior) throw errorAnterior;

  const { error } = await supabase.from("codigos_recuperacion").insert({
    usuario_id: perfil.id,
    codigo_hash: await hashCodigo(perfil.id, codigo),
    expira_at: new Date(Date.now() + VIGENCIA_MS).toISOString(),
  });
  if (error) throw error;

  return json({ ok: true });
}

async function verificar(usuario: string, codigo: string) {
  const perfil = await buscarUsuario(usuario);
  const fila = perfil ? await ultimoCodigoActivo(perfil.id) : null;
  if (!perfil || !fila || vencido(fila)) return json({ error: "codigo_vencido" }, 400);
  if (fila.intentos >= MAX_INTENTOS) return json({ error: "demasiados_intentos" }, 429);

  const { error: errorIntento } = await supabase
    .from("codigos_recuperacion")
    .update({ intentos: fila.intentos + 1 })
    .eq("id", fila.id);
  if (errorIntento) throw errorIntento;

  if ((await hashCodigo(perfil.id, codigo)) !== fila.codigo_hash) {
    return json({ error: "codigo_incorrecto" }, 400);
  }

  const { error } = await supabase
    .from("codigos_recuperacion")
    .update({ verificado: true })
    .eq("id", fila.id);
  if (error) throw error;

  return json({ ok: true });
}

async function restablecer(usuario: string, codigo: string, contrasena: string) {
  const perfil = await buscarUsuario(usuario);
  const fila = perfil ? await ultimoCodigoActivo(perfil.id) : null;
  if (!perfil || !fila || vencido(fila) || !fila.verificado) {
    return json({ error: "codigo_vencido" }, 400);
  }
  if ((await hashCodigo(perfil.id, codigo)) !== fila.codigo_hash) {
    return json({ error: "codigo_incorrecto" }, 400);
  }

  const { error: errorClave } = await supabase.auth.admin.updateUserById(perfil.id, {
    password: contrasena,
  });
  if (errorClave) throw errorClave;

  const { error } = await supabase
    .from("codigos_recuperacion")
    .update({ usado: true })
    .eq("id", fila.id);
  if (error) throw error;

  return json({ ok: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "metodo_no_permitido" }, 405);

    const body = await req.json();
    const accion = String(body?.accion ?? "");
    const usuario = String(body?.usuario ?? "").trim().toLowerCase();
    const codigo = String(body?.codigo ?? "").trim();
    const contrasena = String(body?.contrasena ?? "");

    if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) {
      return json({ error: "datos_invalidos", campo: "usuario" }, 400);
    }

    if (accion === "solicitar") return await solicitar(usuario);

    if (!/^[0-9]{6}$/.test(codigo)) return json({ error: "codigo_incorrecto" }, 400);

    if (accion === "verificar") return await verificar(usuario, codigo);

    if (accion === "restablecer") {
      if (contrasena.length < 8) {
        return json({ error: "datos_invalidos", campo: "contrasena" }, 400);
      }
      return await restablecer(usuario, codigo, contrasena);
    }

    return json({ error: "accion_no_valida" }, 400);
  } catch (err) {
    console.error("recuperar-contrasena", err);
    return json({ error: "error_interno" }, 500);
  }
});
