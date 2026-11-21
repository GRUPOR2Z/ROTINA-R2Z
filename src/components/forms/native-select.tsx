import { ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { Opcao } from "@/lib/opcoes";

/** Select nativo do navegador, com o visual dos outros campos.
 *
 * Usado dentro de janelas modais (<dialog>): a lista do SelectField
 * (base-ui) abre fora da janela, numa camada que o navegador bloqueia
 * enquanto o modal está aberto, então nada podia ser escolhido. A lista
 * nativa abre por cima de tudo. */
export function NativeSelect({
  id,
  name,
  label,
  options,
  defaultValue,
  emptyLabel,
}: {
  id: string;
  name: string;
  label: string;
  options: Opcao[];
  defaultValue?: string | null;
  /** quando definido, adiciona uma opção "vazia" (envia "") no topo */
  emptyLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <select
          id={id}
          name={name}
          defaultValue={defaultValue ?? ""}
          className="h-8 w-full cursor-pointer appearance-none rounded-lg border border-input bg-transparent pr-8 pl-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    </div>
  );
}
