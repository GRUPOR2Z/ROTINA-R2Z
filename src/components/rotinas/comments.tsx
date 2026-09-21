"use client";

import { useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { adicionarComentario } from "@/app/rotinas/actions";

type Comentario = {
  id: string;
  texto: string;
  criado_em: string;
  profiles: { nome: string | null; email: string | null } | null;
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Comments({ taskId, comentarios }: { taskId: string; comentarios: Comentario[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-3">
      {comentarios.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
      )}
      {comentarios.map((c) => (
        <div key={c.id} className="rounded-lg border p-3 text-sm">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {c.profiles?.nome || c.profiles?.email || "—"}
            </span>
            <span>{formatarData(c.criado_em)}</span>
          </div>
          <p>{c.texto}</p>
        </div>
      ))}

      <form
        ref={formRef}
        action={async (formData) => {
          await adicionarComentario(taskId, formData);
          formRef.current?.reset();
        }}
        className="flex flex-col gap-2"
      >
        <Textarea name="texto" placeholder="Escrever um comentário" className="min-h-16 text-sm" required />
        <Button type="submit" size="sm" className="self-end">
          Comentar
        </Button>
      </form>
    </div>
  );
}
