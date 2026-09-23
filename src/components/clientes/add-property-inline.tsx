"use client";

import { useState, useTransition } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PropertyTypeAndOptionsFields } from "@/components/clientes/property-type-fields";
import { criarDefinicaoInline } from "@/app/clientes/propriedades/actions";

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
        <div className="flex flex-col gap-1">
          <Label htmlFor="inline-rotulo">Nome</Label>
          <Input id="inline-rotulo" name="rotulo" placeholder="ex: Situação" required autoFocus className="h-8 text-sm" />
        </div>
        <PropertyTypeAndOptionsFields idPrefix="inline-" />
      </div>
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
