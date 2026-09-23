import Link from "next/link";
import { EmptyState } from "@/components/states/empty-state";
import { ProcessStatusBadge } from "@/components/processos/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vincularProcesso, desvincularProcesso } from "@/app/clientes/actions";

type Processo = {
  id: string;
  titulo: string;
  status: string;
  areas: { nome: string } | null;
  profiles: { nome: string | null; email: string | null } | null;
};

type Vinculo = { id: string; processes: Processo | null };

/** Aba Processos do cliente: só mostra o que está vinculado via
 * `process_clients` -- o processo em si continua vivendo só na
 * biblioteca central (/processos), então processo de outro cliente
 * nunca aparece aqui. */
export function ClientProcessesTab({
  clientId,
  vinculados,
  disponiveis,
}: {
  clientId: string;
  vinculados: Vinculo[];
  disponiveis: { id: string; titulo: string }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {disponiveis.length > 0 ? (
          <form action={vincularProcesso.bind(null, clientId)} className="flex items-center gap-2">
            <Select name="process_id">
              <SelectTrigger className="h-8 w-64 text-sm">
                <SelectValue placeholder="Vincular processo existente" />
              </SelectTrigger>
              <SelectContent>
                {disponiveis.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SubmitButton size="sm" pendingText="Vinculando…">
              Vincular
            </SubmitButton>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">Todos os processos ativos já estão vinculados.</p>
        )}

        <Link href="/processos/novo" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Criar novo processo
        </Link>
      </div>

      {vinculados.length === 0 ? (
        <EmptyState
          title="Nenhum processo vinculado"
          description="Vincule um processo já existente da biblioteca ou crie um novo pra este cliente."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {vinculados.map((vinculo) => {
            const processo = vinculo.processes;
            if (!processo) return null;

            return (
              <div key={vinculo.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/processos/${processo.id}`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {processo.titulo}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <ProcessStatusBadge status={processo.status} />
                    {processo.areas?.nome && <span>{processo.areas.nome}</span>}
                    {processo.profiles && (
                      <span>{processo.profiles.nome || processo.profiles.email}</span>
                    )}
                  </div>
                </div>
                <form action={desvincularProcesso.bind(null, vinculo.id, clientId)}>
                  <Button type="submit" size="sm" variant="ghost">
                    Desvincular
                  </Button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
