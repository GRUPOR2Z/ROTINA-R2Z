import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";
import { getCurrentProfile } from "@/lib/current-profile";
import { createClient } from "@/lib/supabase/server";

/** Entrada do portal. Login de cliente ligado a um cliente so vai
 * direto para a pagina dele; ligado a varios, escolhe. A equipe interna
 * nao usa esta tela (abre o portal pelo botao "Ver como cliente"). */
export default async function PortalPage() {
  const perfil = await getCurrentProfile();
  if (!perfil) redirect("/login");
  if (perfil.papel !== "cliente") redirect("/clientes");

  const supabase = await createClient();
  const { data: vinculos } = await supabase
    .from("client_members")
    .select("client_id, clients(id, nome, avatar_url)")
    .eq("profile_id", perfil.id);

  const clientes = (vinculos ?? [])
    .map((v) => v.clients as unknown as { id: string; nome: string; avatar_url: string | null } | null)
    .filter((c): c is { id: string; nome: string; avatar_url: string | null } => c != null);

  if (clientes.length === 1) redirect(`/portal/${clientes[0].id}`);

  return (
    <PortalShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Olá{perfil.nome ? `, ${perfil.nome}` : ""}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {clientes.length ? "Escolha a conta que quer ver." : "Seu acesso ainda não foi ligado a nenhuma conta. Fale com a equipe do Grupo R2Z."}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clientes.map((c) => (
            <Link
              key={c.id}
              href={`/portal/${c.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-brand-300"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <Building2 size={18} />
              </span>
              <span className="font-medium text-brand-900">{c.nome}</span>
            </Link>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
