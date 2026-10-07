import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DiarioNav } from "@/components/decisoes/fields";
import { EmptyState } from "@/components/states/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatarData, rel } from "@/lib/format";

export default async function ReunioesPage() {
  const supabase = await createClient();
  const { data: reunioes } = await supabase
    .from("meetings")
    .select("id, titulo, data, horario, areas(nome), meeting_participants(profile_id), meeting_action_items(id, task_id)")
    .order("data", { ascending: false })
    .limit(100);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Diário"
          description="Reuniões: pauta, notas e encaminhamentos."
          actions={
            <Link href="/reunioes/nova" className={buttonVariants()}>
              Nova reunião
            </Link>
          }
        >
          <DiarioNav ativo="/reunioes" />
        </PageHeader>

        {!reunioes || reunioes.length === 0 ? (
          <EmptyState title="Nenhuma reunião registrada" description="Registre pauta, notas e encaminhamentos de cada reunião." />
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {reunioes.map((r) => {
              const encaminhamentos = (r.meeting_action_items ?? []) as { id: string; task_id: string | null }[];
              const pendentesDeTarefa = encaminhamentos.filter((e) => !e.task_id).length;
              return (
                <li key={r.id}>
                  <Link href={`/reunioes/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-muted/40">
                    <span className="w-24 shrink-0 text-sm tabular-nums text-muted-foreground">
                      {formatarData(r.data, { ano: true })}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{r.titulo}</span>
                    <span className="text-xs text-muted-foreground">
                      {rel<{ nome: string }>(r.areas)?.nome ?? ""}
                      {" · "}
                      {(r.meeting_participants ?? []).length} participantes · {encaminhamentos.length} encaminhamentos
                      {pendentesDeTarefa > 0 && <span className="text-amber-600"> ({pendentesDeTarefa} sem tarefa)</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
