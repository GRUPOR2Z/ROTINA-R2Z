import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente com service_role — ignora RLS. Uso restrito a rotas de servidor
// (ex.: integrações n8n), nunca importar em código de cliente.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada em .env.local — necessária para rotas de integração.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
