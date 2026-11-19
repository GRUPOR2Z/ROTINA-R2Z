import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getCurrentProfile } from "@/lib/current-profile";
import { Sidebar } from "@/components/layout/nav-links";
import { contarAlertasNaoLidos } from "@/lib/alertas-data";

function iniciais(nome: string | null | undefined, email: string | null | undefined) {
  const base = nome?.trim() || email || "?";
  return base.slice(0, 2).toUpperCase();
}

export async function AppShell({ children }: { children: ReactNode }) {
  // em paralelo; o perfil e' o mesmo (cache) que a pagina usa
  const [profile, alertasNaoLidos] = await Promise.all([getCurrentProfile(), contarAlertasNaoLidos()]);
  // login de cliente so usa o portal (o RLS ja esconde os dados; isso
  // so evita mostrar as telas internas vazias)
  if (profile?.papel === "cliente") redirect("/portal");

  return (
    <div className="min-h-screen bg-background lg:flex">
      <Sidebar
        contadores={{ "/alertas": alertasNaoLidos }}
        usuario={
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-mint text-xs font-semibold text-brand-950">
              {iniciais(profile?.nome, profile?.email)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{profile?.nome || profile?.email}</p>
              <p className="truncate text-xs text-brand-300">{profile?.cargo || "—"}</p>
            </div>
            <form action="/logout" method="post">
              <button
                type="submit"
                title="Sair"
                aria-label="Sair"
                className="rounded-md p-1.5 text-brand-300 hover:bg-white/10 hover:text-white"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        }
      />

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
