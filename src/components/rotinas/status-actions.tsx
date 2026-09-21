"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { atualizarStatus } from "@/app/rotinas/actions";

type Status = "pendente" | "em_andamento" | "concluida" | "bloqueada";

export function StatusActions({ taskId, status }: { taskId: string; status: Status }) {
  const [pending, startTransition] = useTransition();
  const [motivo, setMotivo] = useState("");
  const [bloqueando, setBloqueando] = useState(false);

  function mudar(novo: Status) {
    startTransition(() => {
      atualizarStatus(taskId, novo);
    });
  }

  if (bloqueando) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Motivo do bloqueio"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="h-8 w-56 text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => {
            startTransition(() => {
              atualizarStatus(taskId, "bloqueada", motivo);
            });
            setBloqueando(false);
          }}
        >
          Confirmar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setBloqueando(false)}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "em_andamento" && status !== "concluida" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => mudar("em_andamento")}>
          Iniciar
        </Button>
      )}
      {status !== "concluida" && (
        <Button size="sm" disabled={pending} onClick={() => mudar("concluida")}>
          Concluir
        </Button>
      )}
      {status !== "bloqueada" && status !== "concluida" && (
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => setBloqueando(true)}>
          Bloquear
        </Button>
      )}
      {(status === "concluida" || status === "bloqueada") && (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => mudar("pendente")}>
          Reabrir
        </Button>
      )}
    </div>
  );
}
