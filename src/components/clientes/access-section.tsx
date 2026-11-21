import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { criarAcessoCliente, removerAcessoCliente, salvarPermissoes } from "@/app/clientes/acesso-actions";
import { ACOES, MODULOS, pode, type Permissoes } from "@/lib/permissoes-cliente";

type Acesso = { profileId: string; nome: string | null; email: string | null; permissoes: Permissoes };

/** Logins do cliente no portal (/portal) e o que cada um pode ver,
 * criar e editar em cada área. Excluir é sempre só da equipe. */
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
            O cliente entra com login próprio e vê só a área dele. Em cada login você escolhe o que ele pode ver, criar e
            editar. Excluir é sempre só da equipe.
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
          {acessos.map((a) => {
            const visiveis = MODULOS.filter((m) => pode(a.permissoes, m.valor, "ver"));
            return (
              <div key={a.profileId} className="flex flex-col gap-2 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.nome || "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                  </div>
                  {podeAdministrar && (
                    <form action={removerAcessoCliente.bind(null, clientId, a.profileId)}>
                      <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                        Remover
                      </Button>
                    </form>
                  )}
                </div>
                <p className="flex flex-wrap gap-1">
                  {visiveis.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sem acesso a nenhuma área</span>
                  ) : (
                    visiveis.map((m) => (
                      <span key={m.valor} className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] text-brand-800">
                        {m.rotulo}
                        {pode(a.permissoes, m.valor, "criar") || pode(a.permissoes, m.valor, "editar") ? " ✎" : ""}
                      </span>
                    ))
                  )}
                </p>
                {podeAdministrar && (
                  <details className="rounded-lg bg-muted/50 p-2">
                    <summary className="cursor-pointer text-xs font-medium text-brand-700">Permissões</summary>
                    <form action={salvarPermissoes.bind(null, clientId, a.profileId)} className="mt-2 flex flex-col gap-2">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="py-1 text-left font-medium">Área</th>
                            {ACOES.map((ac) => (
                              <th key={ac.valor} className="w-12 py-1 text-center font-medium">
                                {ac.rotulo}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {MODULOS.map((m) => (
                            <tr key={m.valor} className="border-t border-border/60">
                              <td className="py-1.5 pr-2">{m.rotulo}</td>
                              {ACOES.map((ac) => (
                                <td key={ac.valor} className="text-center">
                                  <input
                                    type="checkbox"
                                    name={`${m.valor}:${ac.valor}`}
                                    defaultChecked={pode(a.permissoes, m.valor, ac.valor)}
                                    aria-label={`${m.rotulo}: ${ac.rotulo}`}
                                    className="size-4 cursor-pointer accent-brand-700"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="text-[11px] text-muted-foreground">Marcar Criar ou Editar já libera o Ver.</p>
                      <SubmitButton size="sm" className="self-start" pendingText="Salvando…">
                        Salvar permissões
                      </SubmitButton>
                    </form>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum login de cliente ainda.</p>
      )}

      {podeAdministrar ? (
        <details className="rounded-lg border border-border p-3" open={Boolean(erro)}>
          <summary className="cursor-pointer text-sm font-medium text-brand-900">+ Criar login para o cliente</summary>
          <form action={criarAcessoCliente.bind(null, clientId)} className="mt-3 grid gap-3">
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
            <SubmitButton size="sm" className="self-start" pendingText="Criando…">
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
