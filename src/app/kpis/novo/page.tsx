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
            <Label htmlFor="nome">Título</Label>
            <Input id="nome" name="nome" required autoFocus />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" name="descricao" placeholder="O que esse número representa" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tipo_meta">Isso é medido em</Label>
            <Select name="tipo_meta" defaultValue="unidade">
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
            <Input id="unidade" name="unidade" placeholder="Ex: vendas, R$, clientes" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="valor_inicial">De quanto</Label>
              <Input id="valor_inicial" name="valor_inicial" type="number" step="any" placeholder="Ex: 2" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="meta">Para quanto (meta)</Label>
              <Input id="meta" name="meta" type="number" step="any" placeholder="Ex: 4" required />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            O farol (Ok/Atenção/Crítico) é calculado sozinho pela distância entre esses dois números e o
            último valor registrado.
          </p>

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
          </div>

          <SubmitButton className="mt-2 self-start" pendingText="Criando…">
            Criar KPI
          </SubmitButton>
        </form>
      </div>
    </AppShell>
  );
}
