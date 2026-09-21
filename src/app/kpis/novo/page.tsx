import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
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
import { getAreasEMembros } from "@/lib/lookups";
import { criarKpi } from "../actions";

export default async function NovoKpiPage() {
  const { areas, membros } = await getAreasEMembros();

  return (
    <AppShell>
      <div className="flex max-w-xl flex-col gap-6">
        <div>
          <Link href="/kpis" className="text-sm text-muted-foreground hover:text-foreground">
            ← KPIs
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Novo KPI</h1>
        </div>

        <form action={criarKpi} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" required autoFocus />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" name="descricao" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="formula">Fórmula</Label>
            <Textarea id="formula" name="formula" placeholder="Como esse número é calculado" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="area_id">Área</Label>
              <Select name="area_id">
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
              <Select name="responsavel_id">
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
              <Input id="unidade" name="unidade" placeholder="%, R$, un." />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="fonte">Fonte</Label>
              <Input id="fonte" name="fonte" placeholder="De onde vem o dado" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="periodicidade">Periodicidade</Label>
              <Select name="periodicidade" defaultValue="mensal">
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
              <Select name="direcao" defaultValue="maior_melhor">
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
              <Label htmlFor="meta">Meta (opcional)</Label>
              <Input id="meta" name="meta" type="number" step="any" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="limiar_atencao">Limiar de atenção</Label>
              <Input id="limiar_atencao" name="limiar_atencao" type="number" step="any" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="limiar_critico">Limiar crítico</Label>
              <Input id="limiar_critico" name="limiar_critico" type="number" step="any" />
            </div>
          </div>

          <SubmitButton className="mt-2 self-start" pendingText="Criando…">
            Criar KPI
          </SubmitButton>
        </form>
      </div>
    </AppShell>
  );
}
