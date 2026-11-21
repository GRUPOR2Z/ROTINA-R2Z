"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { revelarSenha } from "@/app/clientes/credenciais-actions";

/** Botão de copiar um texto já visível (ex: o login). */
export function CopiarTexto({ texto, rotulo = "Copiar" }: { texto: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      onClick={async () => {
        await navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1500);
      }}
      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {copiado ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
    </button>
  );
}

/** Senha escondida (••••••). "Mostrar" busca no servidor, que decifra só
 * para quem tem acesso à conta; "Copiar" busca e copia sem mostrar. */
export function SenhaOculta({ id }: { id: string }) {
  const [senha, setSenha] = useState<string | null>(null);
  const [visivel, setVisivel] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState(false);
  const [carregando, startTransition] = useTransition();

  async function obter() {
    if (senha !== null) return senha;
    const s = await revelarSenha(id);
    if (s === null) setErro(true);
    setSenha(s);
    return s;
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-sm">{erro ? "indisponível" : visivel && senha !== null ? senha : "••••••••"}</span>
      <button
        type="button"
        title={visivel ? "Esconder" : "Mostrar"}
        aria-label={visivel ? "Esconder senha" : "Mostrar senha"}
        onClick={() =>
          startTransition(async () => {
            if (visivel) return setVisivel(false);
            await obter();
            setVisivel(true);
          })
        }
        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {carregando ? <Loader2 size={14} className="animate-spin" /> : visivel ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <button
        type="button"
        title="Copiar senha"
        aria-label="Copiar senha"
        onClick={() =>
          startTransition(async () => {
            const s = await obter();
            if (s === null) return;
            await navigator.clipboard.writeText(s);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1500);
          })
        }
        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {copiado ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
      </button>
    </span>
  );
}
