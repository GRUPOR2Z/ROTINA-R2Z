import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/forms/select-field";
import { opcoesMembros } from "@/lib/opcoes";

type Valores = {
  problemas_comuns?: string | null;
  links?: string | null;
  substituto_id?: string | null;
  frequencia_revisao_dias?: number | null;
  critico?: boolean | null;
};

/** Campos do Doc. 2 que completam o processo: problemas comuns e
 * solucoes, links, revisao periodica e continuidade (substituto). */
export function ProcessExtraFields({
  membros,
  valores = {},
}: {
  membros: { id: string; nome: string | null; email: string | null }[];
  valores?: Valores;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="problemas_comuns">Problemas comuns e soluções</Label>
        <Textarea
          id="problemas_comuns"
          name="problemas_comuns"
          defaultValue={valores.problemas_comuns ?? ""}
          placeholder="Problema → como resolver"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="links">Links úteis</Label>
        <Textarea id="links" name="links" defaultValue={valores.links ?? ""} placeholder="Um por linha" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          name="substituto_id"
          label="Substituto"
          options={opcoesMembros(membros)}
          defaultValue={valores.substituto_id}
          emptyLabel="Nenhum"
          placeholder="Nenhum"
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="frequencia_revisao_dias">Revisar a cada (dias)</Label>
          <Input
            id="frequencia_revisao_dias"
            name="frequencia_revisao_dias"
            type="number"
            min={1}
            defaultValue={valores.frequencia_revisao_dias ?? ""}
            placeholder="ex: 90"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="critico" defaultChecked={Boolean(valores.critico)} className="h-4 w-4" />
        Processo crítico <span className="text-muted-foreground">(deve ter substituto — evita depender de uma pessoa só)</span>
      </label>
    </>
  );
}
