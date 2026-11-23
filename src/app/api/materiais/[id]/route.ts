import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Abre um material do cliente (processo ou roteiro). Link externo:
 * redireciona. PDF: o bucket e' privado, entao gera uma URL assinada
 * curta (60s). A sessao passa pelo RLS: o cliente so abre os dele. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return NextResponse.redirect(new URL("/login", request.url));

  const { data: material } = await supabase
    .from("client_materials")
    .select("url, arquivo_caminho, arquivo_nome")
    .eq("id", id)
    .maybeSingle();

  if (!material) return NextResponse.json({ erro: "não encontrado" }, { status: 404 });
  if (material.url && !material.arquivo_caminho) return NextResponse.redirect(material.url);

  const baixar = request.nextUrl.searchParams.has("baixar");
  const { data } = await supabase.storage
    .from("client-files")
    .createSignedUrl(material.arquivo_caminho!, 60, baixar ? { download: material.arquivo_nome ?? "documento.pdf" } : undefined);

  if (!data?.signedUrl) return NextResponse.json({ erro: "arquivo indisponível" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
