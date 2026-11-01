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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "metodo_no_permitido" }, 405);

    const body = await req.json();
    const nombre = String(body?.nombre ?? "").trim();
    const lada = String(body?.lada ?? "").trim();
    const telefono = String(body?.telefono ?? "").trim();
    const usuario = String(body?.usuario ?? "").trim().toLowerCase();
    const contrasena = String(body?.contrasena ?? "");

    if (!nombre || nombre.length > 100) return json({ error: "datos_invalidos", campo: "nombre" }, 400);
    if (!/^\+[0-9]{1,4}$/.test(lada)) return json({ error: "datos_invalidos", campo: "lada" }, 400);
    if (!/^[0-9]{10}$/.test(telefono)) return json({ error: "datos_invalidos", campo: "telefono" }, 400);
    if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) return json({ error: "datos_invalidos", campo: "usuario" }, 400);
    if (contrasena.length < 8) return json({ error: "datos_invalidos", campo: "contrasena" }, 400);

    const { data: usuarioExistente, error: errorUsuario } = await supabase
      .from("usuarios")
      .select("id")
      .eq("usuario", usuario)
      .maybeSingle();
    if (errorUsuario) throw errorUsuario;
    if (usuarioExistente) return json({ error: "usuario_existe" }, 409);

    const { data: telefonoExistente, error: errorTelefono } = await supabase
      .from("usuarios")
      .select("id")
      .eq("telefono", telefono)
      .maybeSingle();
    if (errorTelefono) throw errorTelefono;
    if (telefonoExistente) return json({ error: "telefono_existe" }, 409);

    const { data: creada, error: errorCuenta } = await supabase.auth.admin.createUser({
      email: `${usuario}@pasofirme.app`,
      password: contrasena,
      email_confirm: true,
    });
    if (errorCuenta || !creada.user) {
      if (errorCuenta?.code === "email_exists" || errorCuenta?.code === "user_already_exists") {
        return json({ error: "usuario_existe" }, 409);
      }
      throw errorCuenta ?? new Error("No se creó la cuenta");
    }

    const { error: errorPerfil } = await supabase
      .from("usuarios")
      .insert({ id: creada.user.id, nombre, lada, telefono, usuario });
    if (errorPerfil) {
      await supabase.auth.admin.deleteUser(creada.user.id);
      if (errorPerfil.code === "23505") {
        return json({ error: errorPerfil.message.includes("telefono") ? "telefono_existe" : "usuario_existe" }, 409);
      }
      throw errorPerfil;
    }

    return json({ ok: true }, 201);
  } catch (err) {
    console.error("registro", err);
    return json({ error: "error_interno" }, 500);
  }
});
