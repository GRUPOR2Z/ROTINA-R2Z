import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";
import { getCurrentProfile } from "@/lib/current-profile";
import { createClient } from "@/lib/supabase/server";

const SECOES = [
  { campo: "objetivo", titulo: "Objetivo" },
  { campo: "gatilho", titulo: "Quando acontece" },
  { campo: "pre_requisitos", titulo: "Pré-requisitos" },
  { campo: "entradas", titulo: "O que é necessário" },
  { campo: "passo_a_passo", titulo: "Passo a passo" },
  { campo: "saidas", titulo: "Resultado" },
  { campo: "criterios_conclusao", titulo: "Como saber que terminou" },
] as const;

type Processo = { id: string; titulo: string; google_doc_url: string | null } & Record<
  (typeof SECOES)[number]["campo"],
  string | null
>;

/** Processo em modo leitura para o cliente. So abre se estiver
 * vinculado a este cliente e marcado como visivel. */
export default async function PortalProcessoPage({
  params,
}: {
  params: Promise<{ id: string; processoId: string }>;
}) {
  const { id, processoId } = await params;
  const perfil = await getCurrentProfile();
  if (!perfil) redirect("/login");

  const supabase = await createClient();
  const [{ data: cliente }, { data: vinculo }, { data: processo }] = await Promise.all([
    supabase.from("clients").select("id, nome").eq("id", id).maybeSingle(),
    supabase
      .from("process_clients")
      .select("id")
      .eq("client_id", id)
      .eq("process_id", processoId)
      .eq("visivel_ao_cliente", true)
      .maybeSingle(),
    supabase
      .from("processes")
      .select("id, titulo, google_doc_url, objetivo, gatilho, pre_requisitos, entradas, passo_a_passo, saidas, criterios_conclusao")
      .eq("id", processoId)
      .maybeSingle<Processo>(),
  ]);
  if (!cliente || !vinculo || !processo) notFound();

  const secoes = SECOES.filter((s) => processo[s.campo]?.trim());

  return (
    <PortalShell clienteNome={cliente.nome} voltarInterno={`/processos/${processo.id}`}>
      <article className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <Link
            href={`/portal/${cliente.id}?tab=processos`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={14} /> Processos
          </Link>
          <h1 className="mt-3 text-2xl font-semibold">{processo.titulo}</h1>
          {processo.google_doc_url && (
            <a
              href={processo.google_doc_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
            >
              <ExternalLink size={14} /> Abrir documento
            </a>
          )}
        </div>

        {secoes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Este processo ainda não tem conteúdo.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {secoes.map((s) => (
              <section key={s.campo} className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-xs font-semibold tracking-wide text-brand-700 uppercase">{s.titulo}</h2>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-foreground">{processo[s.campo]}</p>
              </section>
            ))}
          </div>
        )}
      </article>
    </PortalShell>
  );
}
