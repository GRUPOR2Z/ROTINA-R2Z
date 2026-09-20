import { NextResponse } from "next/server";
import { verificaSegredoN8n } from "@/lib/integration-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const ENDPOINT = "/api/integrations/n8n/webhook";

export async function POST(request: Request) {
  if (!verificaSegredoN8n(request)) {
    return NextResponse.json(
      { status: "erro", mensagem: "Não autenticado." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body.tipo_evento !== "string" || !body.chave_idempotencia) {
    return NextResponse.json(
      { status: "erro", mensagem: "Payload inválido: tipo_evento e chave_idempotencia são obrigatórios." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // idempotencia: uma chave repetida so reconfirma o log, nunca duplica.
  const { data: existente } = await admin
    .from("integration_logs")
    .select("id, status")
    .eq("chave_idempotencia", body.chave_idempotencia)
    .maybeSingle();

  if (existente) {
    return NextResponse.json({
      status: "ok",
      mensagem: "Evento já processado anteriormente.",
      log_id: existente.id,
    });
  }

  // Fase 1: nenhum tipo_evento tem processamento real ainda — so registra.
  const { data: log, error } = await admin
    .from("integration_logs")
    .insert({
      origem: "n8n",
      endpoint: ENDPOINT,
      payload_recebido: body,
      chave_idempotencia: body.chave_idempotencia,
      status: "pendente",
      erro_detalhe: "Recebido e registrado — processamento automatico ainda não implementado (Fase 2+).",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { status: "erro", mensagem: "Falha ao registrar o evento." },
      { status: 500 },
    );
  }

  return NextResponse.json({ status: "ok", log_id: log.id });
}
