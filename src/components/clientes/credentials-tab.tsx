import { ExternalLink, KeyRound, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { CopiarTexto, SenhaOculta } from "@/components/clientes/credential-secret";
import { createClient } from "@/lib/supabase/server";
import { excluirCredencial, salvarCredencial, type Origem } from "@/app/clientes/credenciais-actions";

const SERVICOS = [
  "Instagram",
  "Facebook / Meta Business",
  "Gerenciador de Anúncios (Meta)",
  "Google (Gmail / Drive)",
  "Google Meu Negócio",
  "TikTok",
  "YouTube",
  "LinkedIn",
  "Site / Hospedagem",
  "Domínio",
  "Canva",
];

type Conta = {
  id: string;
  servico: string;
  login: string | null;
  senha_cifrada: string | null;
  url: string | null;
  observacoes: string | null;
  atualizado_em: string;
};

/** Aba Acessos: contas do cliente. A senha fica criptografada e só é
 * decifrada quando alguém clica em "Mostrar"/"Copiar". */
export async function ClientCredentials({
  clientId,
  origem,
  podeCriar,
  podeEditar,
  podeExcluir,
  erro,
}: {
  clientId: string;
  origem: Origem;
  podeCriar: boolean;
  podeEditar: boolean;
  podeExcluir: boolean;
  erro?: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_credentials")
    .select("id, servico, login, senha_cifrada, url, observacoes, atualizado_em")
    .eq("client_id", clientId)
    .order("servico");
  const contas = (data ?? []) as Conta[];

  return (
    <div className="flex flex-col gap-4">
      <datalist id="servicos-sugeridos">
        {SERVICOS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {erro && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      )}

      {podeCriar && (
        <details className="rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium text-brand-900">+ Adicionar conta</summary>
          <form action={salvarCredencial.bind(null, clientId, null, origem)} className="mt-4 flex flex-col gap-3">
            <CamposConta prefixo="nova" />
            <SubmitButton size="sm" className="self-start" pendingText="Salvando…">
              Salvar conta
            </SubmitButton>
          </form>
        </details>
      )}

      {contas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Nenhuma conta salva ainda.
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {contas.map((c) => (
            <article key={c.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <KeyRound size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-brand-900">{c.servico}</h3>
                  {c.url && (
                    <a
                      href={c.url.startsWith("http") ? c.url : `https://${c.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-700 hover:underline"
                    >
                      <ExternalLink size={12} /> {c.url.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
                {podeExcluir && (
                  <form action={excluirCredencial.bind(null, c.id, clientId, origem)}>
                    <Button type="submit" size="sm" variant="ghost" className="text-destructive" title="Excluir conta">
                      <Trash2 size={14} />
                    </Button>
                  </form>
                )}
              </div>

              <dl className="grid grid-cols-[72px_1fr] items-center gap-x-3 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">Login</dt>
                <dd className="flex min-w-0 items-center gap-1">
                  {c.login ? (
                    <>
                      <span className="truncate">{c.login}</span>
                      <CopiarTexto texto={c.login} rotulo="Copiar login" />
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
                <dt className="text-muted-foreground">Senha</dt>
                <dd>{c.senha_cifrada ? <SenhaOculta id={c.id} /> : <span className="text-muted-foreground">—</span>}</dd>
              </dl>

              {c.observacoes && <p className="text-sm whitespace-pre-wrap text-muted-foreground">{c.observacoes}</p>}

              {podeEditar && (
                <details className="border-t border-border pt-3">
                  <summary className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-900">
                    <Pencil size={14} /> Editar
                  </summary>
                  <form action={salvarCredencial.bind(null, clientId, c.id, origem)} className="mt-3 flex flex-col gap-3">
                    <CamposConta prefixo={c.id} conta={c} />
                    <SubmitButton size="sm" className="self-start" pendingText="Salvando…">
                      Salvar alterações
                    </SubmitButton>
                  </form>
                </details>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function CamposConta({ prefixo, conta }: { prefixo: string; conta?: Conta }) {
  const id = (campo: string) => `${campo}-${prefixo}`;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("servico")}>Serviço</Label>
        <Input
          id={id("servico")}
          name="servico"
          list="servicos-sugeridos"
          required
          defaultValue={conta?.servico}
          placeholder="ex: Instagram"
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("login")}>Login (usuário ou e-mail)</Label>
        <Input id={id("login")} name="login" defaultValue={conta?.login ?? ""} autoComplete="off" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("senha")}>{conta?.senha_cifrada ? "Nova senha (deixe vazio para manter)" : "Senha"}</Label>
        <Input id={id("senha")} name="senha" type="password" autoComplete="new-password" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("url")}>Link de acesso (opcional)</Label>
        <Input id={id("url")} name="url" defaultValue={conta?.url ?? ""} placeholder="https://…" autoComplete="off" />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor={id("observacoes")}>Observações (opcional)</Label>
        <Textarea
          id={id("observacoes")}
          name="observacoes"
          rows={2}
          defaultValue={conta?.observacoes ?? ""}
          placeholder="ex: autenticação em dois fatores no celular do Dr. Fulano"
        />
      </div>
    </div>
  );
}
