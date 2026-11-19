import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { criarAcessoCliente, removerAcessoCliente } from "@/app/clientes/acesso-actions";

type Acesso = { profileId: string; nome: string | null; email: string | null };

/** Logins do cliente no portal (/portal): ele ve so o calendario de
 * conteudo e os processos marcados como visiveis, sem editar nada. */
export function ClientAccessSection({
  clientId,
  acessos,
  podeAdministrar,
  aviso,
  erro,
}: {
  clientId: string;
  acessos: Acesso[];
  podeAdministrar: boolean;
  aviso?: string;
  erro?: string;
}) {
  return (
    <section id="acesso" className="flex scroll-mt-6 flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
          <KeyRound size={18} />
        </span>
        <div>
          <h2 className="font-semibold text-brand-900">Acesso do cliente</h2>
          <p className="text-sm text-muted-foreground">
            O cliente entra com login próprio e vê só o calendário de conteúdo e os processos visíveis. Não edita nada
            nem vê o resto do sistema.
          </p>
        </div>
      </div>

      {aviso && (
        <p role="status" className="rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">
          {aviso}
        </p>
      )}
      {erro && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      )}

      {acessos.length > 0 ? (
        <div className="divide-y divide-border rounded-lg border border-border">
          {acessos.map((a) => (
            <div key={a.profileId} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{a.nome || "—"}</p>
                <p className="truncate text-xs text-muted-foreground">{a.email}</p>
              </div>
              {podeAdministrar && (
                <form action={removerAcessoCliente.bind(null, clientId, a.profileId)}>
                  <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                    Remover acesso
                  </Button>
                </form>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum login de cliente ainda.</p>
      )}

      {podeAdministrar ? (
        <details className="rounded-lg border border-border p-3" open={Boolean(erro)}>
          <summary className="cursor-pointer text-sm font-medium text-brand-900">+ Criar login para o cliente</summary>
          <form action={criarAcessoCliente.bind(null, clientId)} className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="acesso-nome">Nome</Label>
              <Input id="acesso-nome" name="nome" required autoComplete="off" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="acesso-email">E-mail</Label>
              <Input id="acesso-email" name="email" type="email" required autoComplete="off" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="acesso-senha">Senha (mín. 8)</Label>
              <Input id="acesso-senha" name="senha" type="text" minLength={8} required autoComplete="new-password" />
            </div>
            <SubmitButton size="sm" className="self-start sm:col-span-3" pendingText="Criando…">
              Criar acesso
            </SubmitButton>
          </form>
        </details>
      ) : (
        <p className="text-xs text-muted-foreground">Só administradores criam ou removem acessos.</p>
      )}
    </section>
  );
}
