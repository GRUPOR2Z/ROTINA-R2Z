"use client";

import { useState, useTransition } from "react";
import { TagsIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { atualizarTipoCliente } from "@/app/clientes/actions";

/** "Tipo de cliente" como a primeira linha da lista de propriedades --
 * é uma coluna fixa em `clients` (não uma propriedade genérica), mas
 * visualmente segue o mesmo padrão das outras linhas. */
export function ClientTypeRow({ clientId, tipoInicial }: { clientId: string; tipoInicial: string | null }) {
  const [tipo, setTipo] = useState(tipoInicial ?? "");
  const [editando, setEditando] = useState(false);
  const [, startTransition] = useTransition();

  function salvar(valor: string) {
    setTipo(valor.trim());
    setEditando(false);
    startTransition(() => {
      atualizarTipoCliente(clientId, valor);
    });
  }

  return (
    <div className="flex items-start gap-3 border-b border-border/60 py-2 text-sm">
      <div className="flex w-40 shrink-0 items-center gap-2 pt-1 text-muted-foreground">
        <TagsIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">Tipo de cliente</span>
      </div>
      <div className="min-w-0 flex-1">
        {editando ? (
          <Input
            autoFocus
            defaultValue={tipo}
            placeholder="ex: clínica, e-commerce"
            className="h-7 text-sm"
            onBlur={(e) => salvar(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setEditando(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="min-h-7 w-full rounded px-1.5 py-0.5 text-left transition-colors hover:bg-muted"
          >
            {tipo || "—"}
          </button>
        )}
      </div>
    </div>
  );
}
