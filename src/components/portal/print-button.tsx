"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

/** Abre a janela de impressão ("Salvar como PDF") assim que a página
 * carrega, e deixa o botão para abrir de novo. Some na impressão. */
export function PrintButton() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
    >
      <Printer size={16} /> Salvar como PDF
    </button>
  );
}
