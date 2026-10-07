import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/forms/select-field";
import { STATUS_MELHORIA, TIPOS_MELHORIA } from "@/lib/melhorias";
import type { Opcao } from "@/lib/opcoes";

const NOTAS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }));

export function ImprovementFields({
  areas,
  membros,
  processos,
  melhoria = {},
  mostrarStatus = false,
}: {
  areas: Opcao[];
  membros: Opcao[];
  processos: Opcao[];
  melhoria?: {
    tipo?: string;
    titulo?: string;
    descricao?: string | null;
    area_id?: string | null;
    responsavel_id?: string | null;
    prioridade?: string;
    impacto?: number | null;
    esforco?: number | null;
    status?: string;
    process_id?: string | null;
  };
  mostrarStatus?: boolean;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[10rem_1fr]">
        <SelectField
          name="tipo"
          label="Tipo"
          options={TIPOS_MELHORIA.map((t) => ({ ...t }))}
          defaultValue={melhoria.tipo ?? "ideia"}
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="titulo">Título</Label>
          <Input id="titulo" name="titulo" defaultValue={melhoria.titulo} required />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" name="descricao" defaultValue={melhoria.descricao ?? ""} placeholder="O que acontece hoje e o que poderia melhorar" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <SelectField name="area_id" label="Área" options={areas} defaultValue={melhoria.area_id} emptyLabel="Sem área" />
        <SelectField name="responsavel_id" label="Responsável" options={membros} defaultValue={melhoria.responsavel_id} emptyLabel="A definir" placeholder="A definir" />
        <SelectField
          name="prioridade"
          label="Prioridade"
          options={[
            { value: "baixa", label: "Baixa" },
            { value: "media", label: "Média" },
            { value: "alta", label: "Alta" },
          ]}
          defaultValue={melhoria.prioridade ?? "media"}
        />
        <SelectField name="impacto" label="Impacto (1–5)" options={NOTAS} defaultValue={melhoria.impacto ? String(melhoria.impacto) : undefined} emptyLabel="—" placeholder="—" />
        <SelectField name="esforco" label="Esforço (1–5)" options={NOTAS} defaultValue={melhoria.esforco ? String(melhoria.esforco) : undefined} emptyLabel="—" placeholder="—" />
        {mostrarStatus && (
          <SelectField name="status" label="Status" options={STATUS_MELHORIA.map((s) => ({ ...s }))} defaultValue={melhoria.status} />
        )}
        <SelectField name="process_id" label="Processo afetado" options={processos} defaultValue={melhoria.process_id} emptyLabel="Nenhum" placeholder="Nenhum" className="col-span-2 flex flex-col gap-2 sm:col-span-1" />
      </div>
    </>
  );
}
