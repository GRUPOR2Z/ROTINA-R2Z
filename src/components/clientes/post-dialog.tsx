"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarDays, FileText, MessageSquareWarning, X } from "lucide-react";

export type PostDetalhe = {
  id: string;
  titulo: string;
  /** "quinta-feira, 20 de novembro · 12:00" */
  quando: string;
  meta: string | null;
  statusRotulo: string;
  statusChip: string;
  roteiro: string | null;
  comentarioCliente: string | null;
  responsavel: string | null;
};

const AbrirPost = createContext<(id: string) => void>(() => {});

/** Envolve o calendário: qualquer <PostTrigger> lá dentro abre a janela
 * do post com os detalhes e o roteiro (que não aparece na grade).
 * `extras` traz o que cada modo acrescenta embaixo: edição (equipe) ou
 * aprovar/pedir ajuste (portal). */
export function PostDialogs({
  posts,
  extras,
  children,
}: {
  posts: PostDetalhe[];
  extras: Record<string, ReactNode>;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState<string | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  const post = posts.find((p) => p.id === aberto) ?? null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (post && !dialog.open) dialog.showModal();
    // post excluído (ou fechado): fecha a janela
    if (!post && dialog.open) dialog.close();
  }, [post]);

  return (
    <AbrirPost.Provider value={setAberto}>
      {children}
      <dialog
        ref={ref}
        onClose={() => setAberto(null)}
        // clique fora do cartão (no fundo escuro) fecha
        onClick={(e) => e.target === e.currentTarget && setAberto(null)}
        className="m-auto max-h-[88vh] w-[min(680px,calc(100vw-2rem))] overflow-hidden rounded-2xl border-0 bg-transparent p-0 shadow-2xl backdrop:bg-brand-950/50 backdrop:backdrop-blur-[2px]"
      >
        {post && (
          <div className="flex max-h-[88vh] flex-col bg-card text-foreground">
            <div className="flex items-start gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0 flex-1">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${post.statusChip}`}>
                  {post.statusRotulo}
                </span>
                <h2 className="mt-2 text-lg leading-snug font-semibold text-brand-900">{post.titulo}</h2>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} /> {post.quando}
                  </span>
                  {post.meta && <span>· {post.meta}</span>}
                  {post.responsavel && <span>· resp. {post.responsavel}</span>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAberto(null)}
                aria-label="Fechar"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
              {post.comentarioCliente && (
                <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
                  <MessageSquareWarning size={16} className="mt-0.5 shrink-0" />
                  <span>
                    <span className="font-medium">Comentário do cliente:</span> {post.comentarioCliente}
                  </span>
                </p>
              )}

              <section>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-700 uppercase">
                  <FileText size={14} /> Roteiro
                </h3>
                {post.roteiro ? (
                  <div className="rounded-lg bg-brand-50/60 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {post.roteiro}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                    Roteiro ainda não adicionado.
                  </p>
                )}
              </section>

              {extras[post.id]}
            </div>
          </div>
        )}
      </dialog>
    </AbrirPost.Provider>
  );
}

/** Qualquer coisa clicável que abre a janela de um post. */
export function PostTrigger({
  id,
  className,
  title,
  children,
}: {
  id: string;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  const abrir = useContext(AbrirPost);
  return (
    <button type="button" onClick={() => abrir(id)} className={className} title={title}>
      {children}
    </button>
  );
}
