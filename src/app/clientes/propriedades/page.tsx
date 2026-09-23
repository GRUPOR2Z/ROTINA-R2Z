import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PropertyTypeAndOptionsFields, TIPOS_CAMPO } from "@/components/clientes/property-type-fields";
import { getCurrentProfile } from "@/lib/current-profile";
import { createClient } from "@/lib/supabase/server";
import { criarDefinicao, arquivarDefinicao, reativarDefinicao, moverDefinicao } from "./actions";

export default async function PropriedadesPage() {
  // schema de propriedades e' decisao administrativa (mesmo corte de
  // "areas: escrita para administrador") -- RLS ja bloqueia no banco,
  // isso aqui e' so pra nao mostrar a tela pra quem nao pode usa-la.
  const perfil = await getCurrentProfile();
  if (!perfil?.isAdmin) redirect("/clientes");

  const supabase = await createClient();
  const { data: definicoes } = await supabase
    .from("client_property_definitions")
    .select("id, rotulo, tipo_campo, tipo_cliente, obrigatorio, ordem, ativo")
    .order("tipo_cliente", { nullsFirst: true })
    .order("ordem");

  return (
    <AppShell>
      <div className="flex max-w-3xl flex-col gap-8">
        <div>
          <Link href="/clientes" className="text-sm text-muted-foreground hover:text-foreground">
            ← Clientes
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Propriedades de cliente</h1>
          <p className="text-sm text-muted-foreground">
            Campos que aparecem na página de cada cliente. Deixe &quot;Tipo de cliente&quot; em branco pra
            valer pra todos.
          </p>
        </div>

        <section className="flex flex-col gap-4 rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Nova propriedade</h2>
          <form action={criarDefinicao} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="rotulo">Rótulo</Label>
                <Input id="rotulo" name="rotulo" placeholder="ex: Saúde do Cliente" required autoFocus />
              </div>
              <PropertyTypeAndOptionsFields />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tipo_cliente">Tipo de cliente (opcional)</Label>
              <Input id="tipo_cliente" name="tipo_cliente" placeholder="Deixe em branco pra valer pra todos" />
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" name="obrigatorio" className="h-4 w-4 rounded border-input accent-primary" />
                Obrigatório
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  name="padrao_visivel_ao_cliente"
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Visível ao cliente quando compartilhado
              </label>
            </div>

            <SubmitButton size="sm" className="self-start" pendingText="Criando…">
              Criar propriedade
            </SubmitButton>
          </form>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Propriedades existentes</h2>
          {!definicoes || definicoes.length === 0 ? (
            <EmptyState title="Nenhuma propriedade criada ainda" />
          ) : (
            <div className="flex flex-col gap-2">
              {definicoes.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.rotulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {TIPOS_CAMPO.find((t) => t.value === d.tipo_campo)?.label ?? d.tipo_campo}
                      {d.tipo_cliente ? ` · ${d.tipo_cliente}` : " · todos os tipos"}
                      {d.obrigatorio && " · obrigatório"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!d.ativo && <Badge variant="outline">Oculta</Badge>}
                    <form action={moverDefinicao.bind(null, d.id, "cima")}>
                      <Button type="submit" size="sm" variant="ghost">
                        ↑
                      </Button>
                    </form>
                    <form action={moverDefinicao.bind(null, d.id, "baixo")}>
                      <Button type="submit" size="sm" variant="ghost">
                        ↓
                      </Button>
                    </form>
                    {d.ativo ? (
                      <form action={arquivarDefinicao.bind(null, d.id)}>
                        <Button type="submit" size="sm" variant="outline">
                          Ocultar
                        </Button>
                      </form>
                    ) : (
                      <form action={reativarDefinicao.bind(null, d.id)}>
                        <Button type="submit" size="sm" variant="outline">
                          Reativar
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
