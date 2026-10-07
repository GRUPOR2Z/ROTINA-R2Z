import { PaperclipIcon, LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttachmentForm } from "@/components/documents/attachment-form";
import { createClient } from "@/lib/supabase/server";
import { excluirDocumento } from "@/app/documentos/actions";
import { formatarTamanho, type EntidadeDocumento } from "@/lib/documents";
import { formatarData, nomeDe, rel } from "@/lib/format";

/** Lista + formulario de anexos/evidencias de qualquer entidade.
 * Server component: busca os documentos sozinho. */
export async function Attachments({
  entidade,
  entidadeId,
  caminhoPagina,
}: {
  entidade: EntidadeDocumento;
  entidadeId: string;
  caminhoPagina: string;
}) {
  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("documents")
    .select("id, nome, url, tamanho_bytes, eh_evidencia, criado_em, profiles(nome, email)")
    .eq("entidade", entidade)
    .eq("entidade_id", entidadeId)
    .order("criado_em", { ascending: false });

  return (
    <div className="flex flex-col gap-3">
      {(!docs || docs.length === 0) && <p className="text-sm text-muted-foreground">Nenhum anexo ainda.</p>}
      {docs && docs.length > 0 && (
        <ul className="flex flex-col divide-y rounded-lg border">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              {d.url ? (
                <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <PaperclipIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <a
                href={`/api/documentos/${d.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate font-medium hover:underline"
              >
                {d.nome}
              </a>
              {d.eh_evidencia && <Badge variant="outline">Evidência</Badge>}
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                {formatarTamanho(d.tamanho_bytes)} · {nomeDe(rel(d.profiles))} · {formatarData(d.criado_em)}
              </span>
              <form action={excluirDocumento.bind(null, d.id, caminhoPagina)}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  aria-label={`Remover ${d.nome}`}
                >
                  ×
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <AttachmentForm entidade={entidade} entidadeId={entidadeId} caminhoPagina={caminhoPagina} />
    </div>
  );
}
