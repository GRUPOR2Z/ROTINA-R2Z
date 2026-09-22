import Link from "next/link";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { PropertyFieldInput } from "@/components/clientes/property-field";
import type { DefinicaoPropriedade } from "@/lib/client-properties";
import { salvarPropriedades } from "@/app/clientes/actions";

type Membro = { id: string; nome: string | null; email: string | null };

export function ClientPropertiesPanel({
  clientId,
  definicoes,
  valorPorDefinicao,
  membros,
}: {
  clientId: string;
  definicoes: DefinicaoPropriedade[];
  valorPorDefinicao: Map<string, unknown>;
  membros: Membro[];
}) {
  if (definicoes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma propriedade configurada ainda.{" "}
        <Link href="/clientes/propriedades" className="underline hover:text-foreground">
          Gerenciar propriedades
        </Link>
        .
      </p>
    );
  }

  return (
    <form action={salvarPropriedades.bind(null, clientId)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {definicoes.map((definicao) => (
          <div key={definicao.id} className="flex flex-col gap-1.5">
            <Label htmlFor={`prop_${definicao.id}`}>
              {definicao.rotulo}
              {definicao.obrigatorio && <span className="text-destructive"> *</span>}
            </Label>
            <PropertyFieldInput
              definicao={definicao}
              valor={valorPorDefinicao.get(definicao.id)}
              membros={membros}
            />
          </div>
        ))}
      </div>
      <SubmitButton size="sm" className="self-start" pendingText="Salvando…">
        Salvar propriedades
      </SubmitButton>
    </form>
  );
}
