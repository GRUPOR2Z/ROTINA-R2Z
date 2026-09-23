"use client";

import { useState, useTransition } from "react";
import { atualizarNomeCliente } from "@/app/clientes/actions";

/** Título da página do cliente, editável no lugar -- clica, digita,
 * sai do campo (ou Enter) e salva. Sem form/botão separado, igual
 * clicar no título de uma página no Notion. */
export function ClientNameEditor({ clientId, nomeInicial }: { clientId: string; nomeInicial: string }) {
  const [nome, setNome] = useState(nomeInicial);
  const [editando, setEditando] = useState(false);
  const [, startTransition] = useTransition();

  function salvar(valor: string) {
    const limpo = valor.trim();
    if (!limpo || limpo === nome) {
      setEditando(false);
      return;
    }
    setNome(limpo);
    setEditando(false);
    startTransition(() => {
      atualizarNomeCliente(clientId, limpo);
    });
  }

  if (editando) {
    return (
      <input
        autoFocus
        defaultValue={nome}
        className="w-full rounded border-none bg-transparent text-2xl font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        onBlur={(e) => salvar(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setEditando(false);
        }}
      />
    );
  }

  return (
    <h1
      onClick={() => setEditando(true)}
      className="cursor-text rounded text-2xl font-semibold tracking-tight transition-colors hover:bg-muted"
      title="Clique para editar o nome"
    >
      {nome}
    </h1>
  );
}
