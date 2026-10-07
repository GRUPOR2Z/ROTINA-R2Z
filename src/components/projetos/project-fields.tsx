import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/forms/select-field";
import { STATUS_PROJETO } from "@/lib/projetos";
import type { Opcao } from "@/lib/opcoes";

type Projeto = {
  nome?: string;
  descricao?: string | null;
  area_id?: string | null;
  responsavel_id?: string | null;
  client_id?: string | null;
  status?: string;
  data_inicio?: string | null;
  prazo?: string | null;
  riscos?: string | null;
};

/** Campos do formulario de projeto (criar e editar usam os mesmos). */
export function ProjectFields({
  areas,
  membros,
  clientes,
  projeto = {},
}: {
  areas: Opcao[];
  membros: Opcao[];
  clientes: Opcao[];
  projeto?: Projeto;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" name="nome" defaultValue={projeto.nome} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" name="descricao" defaultValue={projeto.descricao ?? ""} className="min-h-20" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField name="area_id" label="Área" options={areas} defaultValue={projeto.area_id} emptyLabel="Sem área" />
        <SelectField name="responsavel_id" label="Responsável" options={membros} defaultValue={projeto.responsavel_id} placeholder="Você" />
        <SelectField name="client_id" label="Cliente (opcional)" options={clientes} defaultValue={projeto.client_id} emptyLabel="Nenhum" placeholder="Nenhum" />
        <SelectField
          name="status"
          label="Status"
          options={STATUS_PROJETO.map((s) => ({ value: s.value, label: s.label }))}
          defaultValue={projeto.status ?? "planejamento"}
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="data_inicio">Início</Label>
          <Input id="data_inicio" name="data_inicio" type="date" defaultValue={projeto.data_inicio ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="prazo">Prazo</Label>
          <Input id="prazo" name="prazo" type="date" defaultValue={projeto.prazo ?? ""} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="riscos">Riscos</Label>
        <Textarea
          id="riscos"
          name="riscos"
          defaultValue={projeto.riscos ?? ""}
          placeholder="O que pode atrasar ou dar errado, e o plano pra isso"
        />
      </div>
    </>
  );
}
