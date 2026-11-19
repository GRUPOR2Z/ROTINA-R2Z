import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Eye, LogOut } from "lucide-react";
import { getCurrentProfile } from "@/lib/current-profile";

/** Moldura do portal do cliente: barra verde com a marca, sem o menu
 * interno. Quando alguem da equipe abre o portal ("Ver como cliente"),
 * aparece uma faixa avisando que e' uma pre-visualizacao. */
export async function PortalShell({
  clienteNome,
  voltarInterno,
  children,
}: {
  clienteNome?: string;
  /** link de volta para a pagina interna do cliente (so equipe) */
  voltarInterno?: string;
  children: ReactNode;
}) {
  const perfil = await getCurrentProfile();
  const ehEquipe = perfil != null && perfil.papel !== "cliente";

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      {ehEquipe && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-mint px-4 py-2 text-center text-xs font-medium text-brand-950">
          <span className="inline-flex items-center gap-1.5">
            <Eye size={14} /> Pré-visualização: é assim que o cliente vê esta página.
          </span>
          {voltarInterno && (
            <Link href={voltarInterno} className="inline-flex items-center gap-1 underline underline-offset-2">
              <ArrowLeft size={12} /> Voltar ao sistema
            </Link>
          )}
        </div>
      )}

      <header className="bg-brand-900 text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Image src="/logo-r2z-branco.png" alt="Grupo R2Z" width={298} height={170} className="w-9" priority />
          <div className="min-w-0 leading-tight">
            <p className="text-[10px] font-medium tracking-[0.18em] text-mint uppercase">Grupo R2Z</p>
            <p className="truncate text-sm font-semibold">{clienteNome ?? "Portal do cliente"}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden truncate text-sm text-brand-200 sm:block">{perfil?.nome || perfil?.email}</span>
            <form action="/logout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-brand-200 hover:bg-white/10 hover:text-white"
              >
                <LogOut size={14} /> Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Grupo R2Z
      </footer>
    </div>
  );
}
