import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { FarolBadge } from "@/components/kpis/farol-badge";
import { ProgressBar } from "@/components/okrs/progress-bar";
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
import { calcularFarolPorMeta } from "@/lib/kpi-status";
import { calcularProgresso } from "@/lib/okr";
import { atualizarOkr, registrarValor, excluirValor, excluirOkr } from "../actions";

function formatarData(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function OkrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { areas, membros } = await getAreasEMembros();

  const { data: okr } = await supabase.from("okrs").select("*").eq("id", id).maybeSingle();
  if (!okr) notFound();

  const { data: valores } = await supabase
    .from("okr_values")
    .select("id, valor, referencia_periodo, comentario, criado_em")
    .eq("okr_id", id)
    .order("referencia_periodo", { ascending: false });

  const valorAtual = valores?.[0]?.valor ?? null;
  const farol = calcularFarolPorMeta(valorAtual, okr.valor_inicial, okr.meta);
  const progresso =
    valorAtual !== null && okr.valor_inicial !== null
      ? calcularProgresso(okr.valor_inicial, valorAtual, okr.meta)
      : 0;
  const sufixoUnidade = okr.tipo_meta === "percentual" ? "%" : okr.unidade ? ` ${okr.unidade}` : "";

  return (
    <AppShell>
      <div className="flex max-w-2xl flex-col gap-8">
        <div>
          <Link href="/okrs" className="text-sm text-muted-foreground hover:text-foreground">
            ← OKRs
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{okr.titulo}</h1>
            <FarolBadge farol={farol} />
          </div>
          {okr.descricao && <p className="mt-1 text-sm text-muted-foreground">{okr.descricao}</p>}
          {okr.prazo && <p className="mt-1 text-xs text-muted-foreground">Até {formatarData(okr.prazo)}</p>}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex items-end gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Valor atual</p>
              <p className="text-3xl font-semibold tabular-nums">
                {valorAtual !== null ? valorAtual.toLocaleString("pt-BR") : "—"}
                {valorAtual !== null && (
                  <span className="ml-1 text-base font-normal text-muted-foreground">{sufixoUnidade}</span>
                )}
              </p>
            </div>
            {okr.valor_inicial !== null && (
              <div>
                <p className="text-xs text-muted-foreground">De</p>
                <p className="text-lg font-medium tabular-nums">
                  {okr.valor_inicial.toLocaleString("pt-BR")}
                  {sufixoUnidade}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Para (meta)</p>
              <p className="text-lg font-medium tabular-nums">
                {okr.meta.toLocaleString("pt-BR")}
                {sufixoUnidade}
              </p>
            </div>
            <div className="ml-auto text-right text-xs text-muted-foreground">
              {valores?.[0] && <p>Atualizado em {formatarData(valores[0].referencia_periodo)}</p>}
            </div>
          </div>
          <ProgressBar progresso={progresso} />
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Registrar valor</h2>
          <form
            action={registrarValor.bind(null, okr.id)}
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
              <Label htmlFor="comentario" className="text-xs">
                Justificativa (opcional)
              </Label>
              <Input id="comentario" name="comentario" className="w-56" />
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
                <div key={v.id} className="flex flex-col gap-1 rounded-md border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium tabular-nums">
                      {v.valor.toLocaleString("pt-BR")}
                      {sufixoUnidade}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{formatarData(v.referencia_periodo)}</span>
                      <form action={excluirValor.bind(null, okr.id, v.id)}>
                        <Button type="submit" variant="ghost" size="sm" className="h-6 px-2 text-muted-foreground">
                          Excluir
                        </Button>
                      </form>
                    </div>
                  </div>
                  {v.comentario && <p className="text-xs text-muted-foreground">{v.comentario}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Definição</h2>
          <form action={atualizarOkr.bind(null, okr.id)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" name="titulo" defaultValue={okr.titulo} required />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" name="descricao" defaultValue={okr.descricao ?? ""} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tipo_meta">Isso é medido em</Label>
              <Select name="tipo_meta" defaultValue={okr.tipo_meta}>
                <SelectTrigger id="tipo_meta" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidade">Unidade (vendas, R$, clientes...)</SelectItem>
                  <SelectItem value="percentual">Porcentagem (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="unidade">Nome da unidade (opcional)</Label>
              <Input id="unidade" name="unidade" defaultValue={okr.unidade ?? ""} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="valor_inicial">De quanto</Label>
                <Input
                  id="valor_inicial"
                  name="valor_inicial"
                  type="number"
                  step="any"
                  defaultValue={okr.valor_inicial ?? ""}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="meta">Para quanto (meta)</Label>
                <Input id="meta" name="meta" type="number" step="any" defaultValue={okr.meta ?? ""} required />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="prazo">Prazo</Label>
                <Input id="prazo" name="prazo" type="date" defaultValue={okr.prazo ?? ""} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="area_id">Área</Label>
                <Select name="area_id" defaultValue={okr.area_id ?? undefined}>
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
                <Select name="responsavel_id" defaultValue={okr.responsavel_id ?? undefined}>
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

            <Button type="submit" size="sm" className="self-start">
              Salvar alterações
            </Button>
          </form>
        </section>

        <form action={excluirOkr.bind(null, okr.id)} className="border-t pt-4">
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Excluir OKR
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
