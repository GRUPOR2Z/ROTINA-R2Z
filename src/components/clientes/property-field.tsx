import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { opcoesDaPropriedade, type DefinicaoPropriedade } from "@/lib/client-properties";

type Membro = { id: string; nome: string | null; email: string | null };

/** Renderiza o input certo pra cada `tipo_campo`. Usa checkbox nativo
 * (não o wrapper shadcn) pra booleano/multi_select porque precisamos
 * de FormData padrão (`getAll`) sem depender do form-binding do
 * base-ui, que não é usado em nenhum outro form deste projeto ainda. */
export function PropertyFieldInput({
  definicao,
  valor,
  membros,
}: {
  definicao: DefinicaoPropriedade;
  valor: unknown;
  membros: Membro[];
}) {
  const nomeCampo = `prop_${definicao.id}`;

  switch (definicao.tipo_campo) {
    case "texto":
    case "url":
      return <Input name={nomeCampo} defaultValue={typeof valor === "string" ? valor : ""} />;

    case "numero":
    case "moeda":
      return (
        <Input
          type="number"
          step="any"
          name={nomeCampo}
          defaultValue={typeof valor === "number" ? valor : ""}
        />
      );

    case "data":
      return <Input type="date" name={nomeCampo} defaultValue={typeof valor === "string" ? valor : ""} />;

    case "booleano":
      return (
        <input
          type="checkbox"
          name={nomeCampo}
          defaultChecked={valor === true}
          className="h-4 w-4 rounded border-input accent-primary"
        />
      );

    case "select": {
      const opcoes = opcoesDaPropriedade(definicao);
      return (
        <Select name={nomeCampo} defaultValue={typeof valor === "string" ? valor : undefined}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecionar" />
          </SelectTrigger>
          <SelectContent>
            {opcoes.map((o) => (
              <SelectItem key={o.valor} value={o.valor}>
                {o.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    case "multi_select": {
      const opcoes = opcoesDaPropriedade(definicao);
      const selecionados = Array.isArray(valor) ? valor.map(String) : [];

      if (opcoes.length === 0) {
        return <p className="text-sm text-muted-foreground">Sem opções cadastradas.</p>;
      }

      return (
        <div className="flex flex-wrap gap-3">
          {opcoes.map((o) => (
            <label key={o.valor} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name={nomeCampo}
                value={o.valor}
                defaultChecked={selecionados.includes(o.valor)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              {o.rotulo}
            </label>
          ))}
        </div>
      );
    }

    case "usuario":
      return (
        <Select name={nomeCampo} defaultValue={typeof valor === "string" ? valor : undefined}>
          <SelectTrigger className="w-full">
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
      );

    default:
      return null;
  }
}
