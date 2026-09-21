import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProcessStatusBadge } from "@/components/processos/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";
import { getAreasEMembros } from "@/lib/lookups";
import {
  atualizarProcesso,
  enviarParaRevisao,
  publicarProcesso,
  arquivarProcesso,
  reabrirProcesso,
  excluirProcesso,
} from "../actions";

type Snapshot = {
  titulo: string;
  objetivo: string | null;
  pre_requisitos: string | null;
  gatilho: string | null;
  entradas: string | null;
  passo_a_passo: string | null;
  saidas: string | null;
  criterios_conclusao: string | null;
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ProcessoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { areas, membros } = await getAreasEMembros();

  const { data: processo } = await supabase
    .from("processes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!processo) notFound();

  const { data: versoes } = await supabase
    .from("process_versions")
    .select("id, numero_versao, snapshot, publicado_em, profiles(nome, email)")
    .eq("process_id", id)
    .order("numero_versao", { ascending: false });

  return (
    <AppShell>
      <div className="flex max-w-2xl flex-col gap-8">
        <div>
          <Link href="/processos" className="text-sm text-muted-foreground hover:text-foreground">
            ← Processos
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{processo.titulo}</h1>
            <ProcessStatusBadge status={processo.status} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {processo.status === "rascunho" && (
            <form action={enviarParaRevisao.bind(null, processo.id)}>
              <Button type="submit" size="sm" variant="outline">
                Enviar para revisão
              </Button>
            </form>
          )}
          {(processo.status === "rascunho" || processo.status === "revisao") && (
            <form action={publicarProcesso.bind(null, processo.id)}>
              <Button type="submit" size="sm">
                Publicar
              </Button>
            </form>
          )}
          {processo.status !== "arquivado" && (
            <form action={arquivarProcesso.bind(null, processo.id)}>
              <Button type="submit" size="sm" variant="destructive">
                Arquivar
              </Button>
            </form>
          )}
          {processo.status === "arquivado" && (
            <form action={reabrirProcesso.bind(null, processo.id)}>
              <Button type="submit" size="sm" variant="outline">
                Reabrir como rascunho
              </Button>
            </form>
          )}
        </div>

        <section className="flex flex-col gap-4 rounded-lg border p-4">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground">Conteúdo (rascunho atual)</h2>
            {processo.status === "publicado" && (
              <p className="mt-1 text-xs text-muted-foreground">
                Editar aqui volta o status para rascunho — a versão publicada abaixo não muda sozinha.
              </p>
            )}
          </div>

          <form action={atualizarProcesso.bind(null, processo.id)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" name="titulo" defaultValue={processo.titulo} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="area_id">Área</Label>
                <Select name="area_id" defaultValue={processo.area_id ?? undefined}>
                  <SelectTrigger id="area_id" className="w-full">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="responsavel_id">Responsável</Label>
                <Select name="responsavel_id" defaultValue={processo.responsavel_id ?? undefined}>
                  <SelectTrigger id="responsavel_id" className="w-full">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {membros.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome || m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="objetivo">Objetivo</Label>
              <Textarea id="objetivo" name="objetivo" defaultValue={processo.objetivo ?? ""} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="pre_requisitos">Pré-requisitos</Label>
              <Textarea id="pre_requisitos" name="pre_requisitos" defaultValue={processo.pre_requisitos ?? ""} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="gatilho">Gatilho</Label>
              <Textarea id="gatilho" name="gatilho" defaultValue={processo.gatilho ?? ""} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="entradas">Entradas</Label>
              <Textarea id="entradas" name="entradas" defaultValue={processo.entradas ?? ""} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="passo_a_passo">Passo a passo</Label>
              <Textarea
                id="passo_a_passo"
                name="passo_a_passo"
                className="min-h-32"
                defaultValue={processo.passo_a_passo ?? ""}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="saidas">Saídas</Label>
              <Textarea id="saidas" name="saidas" defaultValue={processo.saidas ?? ""} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="criterios_conclusao">Critérios de conclusão</Label>
              <Textarea
                id="criterios_conclusao"
                name="criterios_conclusao"
                defaultValue={processo.criterios_conclusao ?? ""}
              />
            </div>

            <Button type="submit" size="sm" className="self-start">
              Salvar alterações
            </Button>
          </form>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Versões publicadas {versoes && versoes.length > 0 && `(${versoes.length})`}
          </h2>
          {!versoes || versoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não foi publicado nenhuma vez.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {versoes.map((v) => {
                const snapshot = v.snapshot as unknown as Snapshot;
                const autor = v.profiles as unknown as { nome: string | null; email: string | null } | null;
                return (
                  <details key={v.id} className="rounded-lg border p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      Versão {v.numero_versao} — {formatarData(v.publicado_em)}
                      <span className="ml-2 font-normal text-muted-foreground">
                        por {autor?.nome || autor?.email || "—"}
                      </span>
                    </summary>
                    <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                      {snapshot.objetivo && (
                        <p>
                          <span className="font-medium text-foreground">Objetivo: </span>
                          {snapshot.objetivo}
                        </p>
                      )}
                      {snapshot.passo_a_passo && (
                        <p className="whitespace-pre-wrap">
                          <span className="font-medium text-foreground">Passo a passo: </span>
                          {snapshot.passo_a_passo}
                        </p>
                      )}
                      {snapshot.criterios_conclusao && (
                        <p>
                          <span className="font-medium text-foreground">Critérios de conclusão: </span>
                          {snapshot.criterios_conclusao}
                        </p>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </section>

        <form action={excluirProcesso.bind(null, processo.id)} className="border-t pt-4">
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Excluir processo
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
