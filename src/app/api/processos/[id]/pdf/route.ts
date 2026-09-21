import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarPdfProcesso } from "@/lib/process-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ status: "erro", mensagem: "Não autenticado." }, { status: 401 });
  }

  const { data: processo } = await supabase
    .from("processes")
    .select("titulo, objetivo, pre_requisitos, gatilho, entradas, passo_a_passo, saidas, criterios_conclusao")
    .eq("id", id)
    .maybeSingle();

  if (!processo) {
    return NextResponse.json({ status: "erro", mensagem: "Processo não encontrado." }, { status: 404 });
  }

  const pdfBytes = await gerarPdfProcesso(processo);
  const nomeArquivo = processo.titulo.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "processo";

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomeArquivo}.pdf"`,
    },
  });
}
