import { Download, ExternalLink, FileText, Link2, Trash2, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { PdfPicker } from "@/components/clientes/pdf-picker";
import { createClient } from "@/lib/supabase/server";
import { adicionarMaterial, excluirMaterial, type TipoMaterial } from "@/app/clientes/materiais-actions";

const TEXTOS: Record<TipoMaterial, { vazio: string; novo: string; tituloEx: string }> = {
  processo: {
    vazio: "Nenhum processo disponível ainda.",
    novo: "+ Adicionar processo (link)",
    tituloEx: "ex: Fluxo de aprovação de conteúdo",
  },
  roteiro: {
    vazio: "Nenhum roteiro disponível ainda.",
    novo: "+ Adicionar roteiro (link ou PDF)",
    tituloEx: "ex: Roteiros de dezembro",
  },
};

function dominio(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Aba Processos (só links) ou Roteiros (link e/ou PDF) do cliente.
 * Mesma lista na página interna (com adicionar/excluir) e no portal. */
export async function ClientMaterials({
  clientId,
  tipo,
  editavel = false,
  erro,
}: {
  clientId: string;
  tipo: TipoMaterial;
  editavel?: boolean;
  erro?: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_materials")
    .select("id, titulo, descricao, url, arquivo_caminho, arquivo_nome, criado_em")
    .eq("client_id", clientId)
    .eq("tipo", tipo)
    .order("criado_em", { ascending: false });
  const itens = data ?? [];
  const textos = TEXTOS[tipo];
  const Icone = tipo === "processo" ? Workflow : FileText;

  return (
    <div className="flex flex-col gap-4">
      {editavel && (
        <details className="rounded-xl border border-border bg-card p-4" open={Boolean(erro)}>
          <summary className="cursor-pointer text-sm font-medium text-brand-900">{textos.novo}</summary>
          <form action={adicionarMaterial.bind(null, clientId, tipo)} className="mt-4 flex flex-col gap-3">
            {erro && (
              <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {erro}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`titulo-${tipo}`}>Título</Label>
                <Input id={`titulo-${tipo}`} name="titulo" required placeholder={textos.tituloEx} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`url-${tipo}`}>Link{tipo === "roteiro" ? " (opcional se enviar PDF)" : ""}</Label>
                <Input
                  id={`url-${tipo}`}
                  name="url"
                  required={tipo === "processo"}
                  placeholder="https://…"
                  inputMode="url"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor={`descricao-${tipo}`}>Descrição (opcional)</Label>
                <Input id={`descricao-${tipo}`} name="descricao" placeholder="Uma linha explicando o que é" />
              </div>
              {tipo === "roteiro" && (
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label>PDF (opcional se colar link)</Label>
                  <PdfPicker />
                </div>
              )}
            </div>
            <SubmitButton size="sm" className="self-start" pendingText="Salvando…">
              Adicionar
            </SubmitButton>
          </form>
        </details>
      )}

      {itens.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {textos.vazio}
        </p>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {itens.map((m) => {
            const ehPdf = Boolean(m.arquivo_caminho);
            return (
              <div key={m.id} className="flex flex-wrap items-center gap-4 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <Icone size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <a
                    href={`/api/materiais/${m.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand-900 hover:underline"
                  >
                    {m.titulo}
                  </a>
                  {m.descricao && <p className="mt-0.5 text-sm text-muted-foreground">{m.descricao}</p>}
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {ehPdf && (
                      <span className="inline-flex items-center gap-1">
                        <FileText size={12} /> {m.arquivo_nome ?? "PDF"}
                      </span>
                    )}
                    {m.url && (
                      <a href={m.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                        <Link2 size={12} /> {dominio(m.url)}
                      </a>
                    )}
                    <span>{new Date(m.criado_em).toLocaleDateString("pt-BR")}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={`/api/materiais/${m.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-900 px-3 text-sm font-medium text-white hover:bg-brand-800"
                  >
                    <ExternalLink size={14} /> Abrir
                  </a>
                  {ehPdf && (
                    <a
                      href={`/api/materiais/${m.id}?baixar`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-brand-900 hover:bg-brand-50"
                    >
                      <Download size={14} /> Baixar
                    </a>
                  )}
                  {editavel && (
                    <form action={excluirMaterial.bind(null, m.id, clientId, tipo)}>
                      <Button type="submit" size="sm" variant="ghost" className="text-destructive" title="Excluir">
                        <Trash2 size={14} />
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
