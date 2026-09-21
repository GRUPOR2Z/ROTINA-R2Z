import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { FarolBadge } from "@/components/kpis/farol-badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
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
import { calcularFarol, type DirecaoKpi } from "@/lib/kpi-status";
import { atualizarKpi, registrarValor, excluirValor, excluirKpi } from "../actions";

function formatarData(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ROTULO_TIPO: Record<string, string> = {
  real: "Real",
  estimado: "Estimado",
  manual: "Manual",
  importado: "Importado",
  calculado: "Calculado",
};

export default async function KpiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { areas, membros } = await getAreasEMembros();

  const { data: kpi } = await supabase.from("kpis").select("*").eq("id", id).maybeSingle();
  if (!kpi) notFound();

  const { data: valores } = await supabase
    .from("kpi_values")
    .select("id, valor, tipo_valor, referencia_periodo, criado_em")
    .eq("kpi_id", id)
    .order("referencia_periodo", { ascending: false });

  const valorAtual = valores?.[0]?.valor ?? null;
  const farol = calcularFarol(valorAtual, kpi.limiar_atencao, kpi.limiar_critico, kpi.direcao as DirecaoKpi);

  return (
    <AppShell>
      <div className="flex max-w-2xl flex-col gap-8">
        <div>
          <Link href="/kpis" className="text-sm text-muted-foreground hover:text-foreground">
            ← KPIs
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{kpi.nome}</h1>
            <FarolBadge farol={farol} />
          </div>
          {kpi.descricao && <p className="mt-1 text-sm text-muted-foreground">{kpi.descricao}</p>}
        </div>

        <div className="flex items-end gap-6 rounded-lg border p-4">
          <div>
            <p className="text-xs text-muted-foreground">Valor atual</p>
            <p className="text-3xl font-semibold tabular-nums">
              {valorAtual !== null ? valorAtual.toLocaleString("pt-BR") : "—"}
              {kpi.unidade && valorAtual !== null && (
                <span className="ml-1 text-base font-normal text-muted-foreground">{kpi.unidade}</span>
              )}
            </p>
          </div>
          {kpi.meta !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Meta</p>
              <p className="text-lg font-medium tabular-nums">
                {kpi.meta.toLocaleString("pt-BR")} {kpi.unidade}
              </p>
            </div>
          )}
          <div className="ml-auto text-right text-xs text-muted-foreground">
            {valores?.[0] && <p>Atualizado em {formatarData(valores[0].referencia_periodo)}</p>}
          </div>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Registrar valor</h2>
          <form
            action={registrarValor.bind(null, kpi.id)}
            className="flex flex-wrap items-end gap-3 rounded-lg border p-3"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valor" className="text-xs">
                Valor
              </Label>
              <Input id="valor" name="valor" type="number" step="any" required className="w-32" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="referencia_periodo" className="text-xs">
                Referente a
              </Label>
              <Input id="referencia_periodo" name="referencia_periodo" type="date" required className="w-40" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tipo_valor" className="text-xs">
                Tipo
              </Label>
              <Select name="tipo_valor" defaultValue="manual">
                <SelectTrigger id="tipo_valor" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="real">Real</SelectItem>
                  <SelectItem value="estimado">Estimado</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="importado">Importado</SelectItem>
                  <SelectItem value="calculado">Calculado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SubmitButton size="sm" pendingText="Salvando…">
              Registrar
            </SubmitButton>
          </form>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Histórico {valores && valores.length > 0 && `(${valores.length})`}
          </h2>
          {!valores || valores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum valor registrado ainda.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {valores.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span className="font-medium tabular-nums">
                    {v.valor.toLocaleString("pt-BR")} {kpi.unidade}
                  </span>
                  <span className="text-muted-foreground">{formatarData(v.referencia_periodo)}</span>
                  <span className="text-xs text-muted-foreground">{ROTULO_TIPO[v.tipo_valor]}</span>
                  <form action={excluirValor.bind(null, kpi.id, v.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="h-6 px-2 text-muted-foreground">
                      Excluir
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Definição</h2>
          <form action={atualizarKpi.bind(null, kpi.id)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" defaultValue={kpi.nome} required />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" name="descricao" defaultValue={kpi.descricao ?? ""} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="formula">Fórmula</Label>
              <Textarea id="formula" name="formula" defaultValue={kpi.formula ?? ""} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="area_id">Área</Label>
                <Select name="area_id" defaultValue={kpi.area_id ?? undefined}>
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
                <Select name="responsavel_id" defaultValue={kpi.responsavel_id ?? undefined}>
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

              <div className="flex flex-col gap-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Input id="unidade" name="unidade" defaultValue={kpi.unidade ?? ""} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="fonte">Fonte</Label>
                <Input id="fonte" name="fonte" defaultValue={kpi.fonte ?? ""} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="periodicidade">Periodicidade</Label>
                <Select name="periodicidade" defaultValue={kpi.periodicidade}>
                  <SelectTrigger id="periodicidade" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diaria">Diária</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="direcao">O que é bom</Label>
                <Select name="direcao" defaultValue={kpi.direcao}>
                  <SelectTrigger id="direcao" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maior_melhor">Valor maior é melhor</SelectItem>
                    <SelectItem value="menor_melhor">Valor menor é melhor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="meta">Meta</Label>
                <Input id="meta" name="meta" type="number" step="any" defaultValue={kpi.meta ?? ""} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="limiar_atencao">Limiar de atenção</Label>
                <Input
                  id="limiar_atencao"
                  name="limiar_atencao"
                  type="number"
                  step="any"
                  defaultValue={kpi.limiar_atencao ?? ""}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="limiar_critico">Limiar crítico</Label>
                <Input
                  id="limiar_critico"
                  name="limiar_critico"
                  type="number"
                  step="any"
                  defaultValue={kpi.limiar_critico ?? ""}
                />
              </div>
            </div>

            <Button type="submit" size="sm" className="self-start">
              Salvar alterações
            </Button>
          </form>
        </section>

        <form action={excluirKpi.bind(null, kpi.id)} className="border-t pt-4">
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Excluir KPI
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
