"use client";

import { useState } from "react";
import { FileUp, X } from "lucide-react";

/** Escolha de PDF com cara de botão (sem o "Escolher ficheiro" do
 * navegador), mostrando o nome do arquivo escolhido. */
export function PdfPicker({ name = "arquivo" }: { name?: string }) {
  const [nome, setNome] = useState<string | null>(null);
  const [chave, setChave] = useState(0);

  return (
    <div className="flex items-center gap-2">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-brand-300 bg-brand-50/60 px-3 py-2 text-sm font-medium text-brand-800 transition hover:border-brand-500 hover:bg-brand-50">
        <FileUp size={16} />
        {nome ? "Trocar PDF" : "Escolher PDF"}
        <input
          key={chave}
          type="file"
          name={name}
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => setNome(e.target.files?.[0]?.name ?? null)}
        />
      </label>
      {nome && (
        <span className="inline-flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          <span className="truncate">{nome}</span>
          <button
            type="button"
            aria-label="Remover PDF escolhido"
            onClick={() => {
              setNome(null);
              setChave((c) => c + 1);
            }}
            className="rounded p-0.5 hover:bg-muted hover:text-foreground"
          >
            <X size={14} />
          </button>
        </span>
      )}
    </div>
  );
}
