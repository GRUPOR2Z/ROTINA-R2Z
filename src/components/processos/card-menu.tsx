"use client";

import { useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { exportarParaGoogleDocs } from "@/app/processos/actions";

export function ProcessCardMenu({
  processId,
  googleDocUrl,
}: {
  processId: string;
  googleDocUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Mais ações">
            <MoreHorizontal className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<a href={`/api/processos/${processId}/pdf`} />}>
          Baixar PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={pending}
          onClick={() => startTransition(() => exportarParaGoogleDocs(processId))}
        >
          {pending
            ? "Enviando…"
            : googleDocUrl
              ? "Atualizar no Google Docs"
              : "Exportar para Google Docs"}
        </DropdownMenuItem>
        {googleDocUrl && (
          <DropdownMenuItem
            render={<a href={googleDocUrl} target="_blank" rel="noopener noreferrer" />}
          >
            Abrir no Google Docs ↗
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
