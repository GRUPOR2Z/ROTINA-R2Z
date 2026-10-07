import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/forms/select-field";
import { ParticipantsField } from "@/components/forms/participants-field";
import { SubNav } from "@/components/layout/page-header";
import { dateKey } from "@/lib/calendar";
import type { Opcao } from "@/lib/opcoes";

type Membro = { id: string; nome: string | null; email: string | null };

export function DiarioNav({ ativo }: { ativo: "/decisoes" | "/reunioes" }) {
  return (
    <SubNav
      ativo={ativo}
      items={[
        { href: "/decisoes", label: "Decisões" },
        { href: "/reunioes", label: "Reuniões" },
      ]}
    />
  );
}

export function MeetingFields({
  areas,
  membros,
  reuniao = {},
  participantes = [],
}: {
  areas: Opcao[];
  membros: Membro[];
  reuniao?: {
    titulo?: string;
    data?: string;
    horario?: string | null;
    area_id?: string | null;
    pauta?: string | null;
    notas?: string | null;
  };
  participantes?: string[];
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" name="titulo" defaultValue={reuniao.titulo} required />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="data">Data</Label>
          <Input id="data" name="data" type="date" defaultValue={reuniao.data ?? dateKey(new Date())} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="horario">Horário</Label>
          <Input id="horario" name="horario" type="time" defaultValue={reuniao.horario?.slice(0, 5) ?? ""} />
        </div>
        <SelectField name="area_id" label="Área" options={areas} defaultValue={reuniao.area_id} emptyLabel="Sem área" />
      </div>
      <ParticipantsField membros={membros} selecionados={participantes} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="pauta">Pauta</Label>
        <Textarea id="pauta" name="pauta" defaultValue={reuniao.pauta ?? ""} placeholder="Um assunto por linha" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notas">Notas / ata</Label>
        <Textarea id="notas" name="notas" defaultValue={reuniao.notas ?? ""} className="min-h-32" />
      </div>
    </>
  );
}

export function DecisionFields({
  areas,
  membros,
  reunioes,
  processos,
  okrs,
  decisao = {},
  participantes = [],
}: {
  areas: Opcao[];
  membros: Membro[];
  reunioes: Opcao[];
  processos: Opcao[];
  okrs: Opcao[];
  decisao?: {
    titulo?: string;
    data?: string;
    contexto?: string | null;
    decisao?: string;
    motivo?: string | null;
    impacto_esperado?: string | null;
    responsavel_id?: string | null;
    prazo?: string | null;
    area_id?: string | null;
    meeting_id?: string | null;
    process_id?: string | null;
    task_id?: string | null;
    okr_id?: string | null;
  };
  participantes?: string[];
}) {
  const opcoesMembro = membros.map((m) => ({ value: m.id, label: m.nome || m.email || "—" }));
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" name="titulo" defaultValue={decisao.titulo} required />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="data">Data</Label>
          <Input id="data" name="data" type="date" defaultValue={decisao.data ?? dateKey(new Date())} required />
        </div>
        <SelectField name="area_id" label="Área" options={areas} defaultValue={decisao.area_id} emptyLabel="Sem área" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contexto">Contexto</Label>
        <Textarea id="contexto" name="contexto" defaultValue={decisao.contexto ?? ""} placeholder="Qual era a situação" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="decisao">Decisão</Label>
        <Textarea id="decisao" name="decisao" defaultValue={decisao.decisao ?? ""} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="motivo">Motivo</Label>
        <Textarea id="motivo" name="motivo" defaultValue={decisao.motivo ?? ""} placeholder="Por que essa e não outra" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="impacto_esperado">Impacto esperado</Label>
        <Textarea id="impacto_esperado" name="impacto_esperado" defaultValue={decisao.impacto_esperado ?? ""} />
      </div>
      <ParticipantsField membros={membros} selecionados={participantes} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField name="responsavel_id" label="Responsável" options={opcoesMembro} defaultValue={decisao.responsavel_id} emptyLabel="Ninguém" />
        <div className="flex flex-col gap-2">
          <Label htmlFor="prazo">Prazo</Label>
          <Input id="prazo" name="prazo" type="date" defaultValue={decisao.prazo ?? ""} />
        </div>
        <SelectField name="meeting_id" label="Reunião" options={reunioes} defaultValue={decisao.meeting_id} emptyLabel="Nenhuma" placeholder="Nenhuma" />
        <SelectField name="process_id" label="Processo" options={processos} defaultValue={decisao.process_id} emptyLabel="Nenhum" placeholder="Nenhum" />
        <SelectField name="okr_id" label="OKR / iniciativa" options={okrs} defaultValue={decisao.okr_id} emptyLabel="Nenhum" placeholder="Nenhum" />
      </div>
      {decisao.task_id && <input type="hidden" name="task_id" value={decisao.task_id} />}
    </>
  );
}
