import Link from "next/link";
import { PropertyRow } from "@/components/clientes/property-row";
import { ClientTypeRow } from "@/components/clientes/client-type-row";
import { AddPropertyInline } from "@/components/clientes/add-property-inline";
import type { DefinicaoPropriedade } from "@/lib/client-properties";

type Membro = { id: string; nome: string | null; email: string | null };

/** Lista de propriedades no estilo Notion: ícone + rótulo à esquerda,
 * valor editável (auto-save) à direita, sem card com borda nem botão
 * de "salvar tudo" -- cada linha se vira sozinha. */
export function ClientPropertiesPanel({
  clientId,
  tipoCliente,
  definicoes,
  valorPorDefinicao,
  membros,
  podeAdministrar,
}: {
  clientId: string;
  tipoCliente: string | null;
  definicoes: DefinicaoPropriedade[];
  valorPorDefinicao: Map<string, unknown>;
  membros: Membro[];
  podeAdministrar: boolean;
}) {
  return (
    <div className="flex flex-col">
      <ClientTypeRow clientId={clientId} tipoInicial={tipoCliente} />

      {definicoes.map((definicao) => (
        <PropertyRow
          key={definicao.id}
          clientId={clientId}
          definicao={definicao}
          valorInicial={valorPorDefinicao.get(definicao.id)}
          membros={membros}
        />
      ))}

      {podeAdministrar && (
        <div className="flex items-center justify-between pt-1">
          <AddPropertyInline clientId={clientId} />
          <Link
            href="/clientes/propriedades"
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Gerenciar propriedades
          </Link>
        </div>
      )}
    </div>
  );
}
