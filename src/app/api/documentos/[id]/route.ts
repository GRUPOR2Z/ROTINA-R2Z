import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Download de anexo: o bucket e' privado, entao gera uma URL assinada
 * curta (60s) e redireciona. A sessao do usuario passa pelo RLS. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "não autenticado" }, { status: 401 });

  const { data: doc } = await supabase
    .from("documents")
    .select("caminho, url, nome")
    .eq("id", id)
    .maybeSingle();

  if (!doc) return NextResponse.json({ erro: "não encontrado" }, { status: 404 });
  if (doc.url) return NextResponse.redirect(doc.url);

  const { data } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.caminho!, 60, { download: doc.nome });

  if (!data?.signedUrl) return NextResponse.json({ erro: "arquivo indisponível" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
