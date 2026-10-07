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
import { ColorSelect } from "@/components/rotinas/color-select";
import { SelectField } from "@/components/forms/select-field";
import { ErroBanner } from "@/components/layout/page-header";
import { getAreasEMembros, getVinculosTarefa } from "@/lib/lookups";
import { getClientesAtivos } from "@/lib/clients-data";
import { criarTarefa } from "../actions";

export default async function NovaTarefaPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; projeto?: string; processo?: string; kpi?: string; okr?: string; erro?: string }>;
}) {
  const { cliente, projeto, processo, kpi, okr, erro } = await searchParams;
  const { areas, membros } = await getAreasEMembros();
  const clientes = await getClientesAtivos();
  const vinculos = await getVinculosTarefa();

  return (
    <AppShell>
      <div className="flex max-w-xl flex-col gap-6">
        <div>
          <Link href="/rotinas" className="text-sm text-muted-foreground hover:text-foreground">
            ← Rotinas
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nova tarefa</h1>
        </div>

        <ErroBanner erro={erro} />

        <form action={criarTarefa} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" name="titulo" required autoFocus />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" name="descricao" className="min-h-24" />
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
                  <SelectValue placeholder="Você" />
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
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select name="prioridade" defaultValue="media">
                <SelectTrigger id="prioridade" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="prazo">Prazo</Label>
              <Input id="prazo" name="prazo" type="date" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="horario">Horário (opcional)</Label>
              <Input id="horario" name="horario" type="time" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="cor">Cor</Label>
              <ColorSelect />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="client_id">Cliente (opcional)</Label>
              <Select name="client_id" defaultValue={cliente}>
                <SelectTrigger id="client_id" className="w-full">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="justificativa_sem_prazo">Justificativa para não ter prazo</Label>
              <Input
                id="justificativa_sem_prazo"
                name="justificativa_sem_prazo"
                placeholder="Só se o prazo ficar em branco — ex: contínua, aguardando cliente"
              />
            </div>

            <SelectField name="project_id" label="Projeto" options={vinculos.projetos} defaultValue={projeto} emptyLabel="Nenhum" placeholder="Nenhum" />
            <SelectField name="process_id" label="Processo" options={vinculos.processos} defaultValue={processo} emptyLabel="Nenhum" placeholder="Nenhum" />
            <SelectField name="kpi_id" label="KPI" options={vinculos.kpis} defaultValue={kpi} emptyLabel="Nenhum" placeholder="Nenhum" />
            <SelectField name="okr_id" label="OKR / iniciativa" options={vinculos.okrs} defaultValue={okr} emptyLabel="Nenhum" placeholder="Nenhum" />

            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="frequencia">Repetir</Label>
              <Select name="frequencia" defaultValue="nenhuma">
                <SelectTrigger id="frequencia" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">Não se repete</SelectItem>
                  <SelectItem value="diaria">Repete todo dia</SelectItem>
                  <SelectItem value="semanal">Repete toda semana</SelectItem>
                  <SelectItem value="mensal">Repete todo mês</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Precisa de um prazo definido — a próxima ocorrência é criada automaticamente quando você concluir esta.
              </p>
            </div>
          </div>

          <SubmitButton className="mt-2 self-start" pendingText="Criando…">
            Criar tarefa
          </SubmitButton>
        </form>
      </div>
    </AppShell>
  );
}
