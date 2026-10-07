"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { anexarDocumento } from "@/app/documentos/actions";
import type { EntidadeDocumento } from "@/lib/documents";

export function AttachmentForm({
  entidade,
  entidadeId,
  caminhoPagina,
}: {
  entidade: EntidadeDocumento;
  entidadeId: string;
  caminhoPagina: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [modo, setModo] = useState<"arquivo" | "link">("arquivo");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setErro(null);
        startTransition(async () => {
          const resultado = await anexarDocumento(entidade, entidadeId, caminhoPagina, formData);
          if (resultado.erro) setErro(resultado.erro);
          else formRef.current?.reset();
        });
      }}
      className="flex flex-col gap-2 rounded-lg border border-dashed p-3"
    >
      <div className="flex gap-3 text-xs">
        <button
          type="button"
          onClick={() => setModo("arquivo")}
          className={modo === "arquivo" ? "font-medium text-foreground" : "text-muted-foreground"}
        >
          Arquivo
        </button>
        <button
          type="button"
          onClick={() => setModo("link")}
          className={modo === "link" ? "font-medium text-foreground" : "text-muted-foreground"}
        >
          Link
        </button>
      </div>

      {modo === "arquivo" ? (
        <Input name="arquivo" type="file" className="text-sm" aria-label="Arquivo" />
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input name="nome" placeholder="Nome (opcional)" className="text-sm sm:w-48" />
          <Input name="url" type="url" placeholder="https://…" className="flex-1 text-sm" aria-label="Link" />
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" name="eh_evidencia" className="h-3.5 w-3.5" />
          Marcar como evidência
        </label>
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Enviando…" : "Anexar"}
        </Button>
      </div>
      {erro && (
        <p role="alert" className="text-xs text-destructive">
          {erro}
        </p>
      )}
    </form>
  );
}
