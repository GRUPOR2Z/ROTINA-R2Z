"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Resposta do cliente a um post "Aguardando aprovação": aprova ou pede
 * ajuste (com comentário). Passa pela função responder_post, que confere
 * no banco se o login enxerga esse cliente e se o post está em aprovação. */
export async function responderPost(eventId: string, clientId: string, aprovado: boolean, formData: FormData) {
  const supabase = await createClient();
  const comentario = String(formData.get("comentario") ?? "").trim() || null;

  await supabase.rpc("responder_post", {
    p_event_id: eventId,
    p_aprovado: aprovado,
    p_comentario: comentario,
  });

  revalidatePath(`/portal/${clientId}`);
  revalidatePath(`/clientes/${clientId}`);
}
