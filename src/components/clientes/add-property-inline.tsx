"use client";

import { useState, useTransition } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { criarDefinicaoInline } from "@/app/clientes/propriedades/actions";

const TIPOS_CAMPO = [
  { value: "texto", label: "Texto" },
  { value: "numero", label: "Número" },
  { value: "moeda", label: "Moeda (R$)" },
  { value: "data", label: "Data" },
  { value: "booleano", label: "Sim/Não" },
  { value: "select", label: "Seleção única" },
  { value: "multi_select", label: "Seleção múltipla" },
  { value: "usuario", label: "Pessoa da equipe" },
  { value: "url", label: "Link" },
] as const;

/** "+ Adicionar propriedade" direto na página do cliente -- cria uma
 * propriedade global (aplica a todos os tipos de cliente). Pra
 * escopar por tipo ou reordenar/ocultar, usa `/clientes/propriedades`. */
export function AddPropertyInline({ clientId }: { clientId: string }) {
  const [aberto, setAberto] = useState(false);
  const [, startTransition] = useTransition();

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex items-center gap-1.5 px-1 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Adicionar propriedade
      </button>
    );
  }

  return (
    <form
      action={(formData: FormData) => {
        startTransition(async () => {
          await criarDefinicaoInline(clientId, formData);
          setAberto(false);
        });
      }}
      className="flex flex-col gap-2 rounded-lg border p-3"
    >
      <div className="grid grid-cols-2 gap-2">
        <Input name="rotulo" placeholder="Nome da propriedade" required autoFocus className="h-8 text-sm" />
        <Select name="tipo_campo" defaultValue="texto">
          <SelectTrigger className="h-8 w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_CAMPO.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Textarea
        name="opcoes"
        placeholder={"valor:rótulo, uma por linha -- só p/ seleção única ou múltipla"}
        className="h-16 text-xs"
      />
      <div className="flex gap-2">
        <SubmitButton size="sm" pendingText="Criando…">
          Adicionar
        </SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
