import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, FileText, Workflow } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";
import { ClientCalendar } from "@/components/clientes/calendar";
import { ClientMaterials } from "@/components/clientes/materials-tab";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCurrentProfile } from "@/lib/current-profile";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const ABAS = [
  { valor: "calendario", rotulo: "Calendário de conteúdo", icone: CalendarDays },
  { valor: "processos", rotulo: "Processos", icone: Workflow },
  { valor: "roteiros", rotulo: "Roteiros", icone: FileText },
] as const;

type Aba = (typeof ABAS)[number]["valor"];

/** A "aba" do cliente no hub: calendário de conteúdo, processos (links)
 * e roteiros (links e PDFs), só leitura. O RLS garante que um login de
 * cliente só enxerga o próprio cliente. */
export default async function PortalClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; mes?: string }>;
}) {
  const { id } = await params;
  const { tab, mes } = await searchParams;
  const aba: Aba = ABAS.some((a) => a.valor === tab) ? (tab as Aba) : "calendario";

  const perfil = await getCurrentProfile();
  if (!perfil) redirect("/login");

  const supabase = await createClient();
  const { data: cliente } = await supabase.from("clients").select("id, nome, avatar_url").eq("id", id).maybeSingle();
  if (!cliente) notFound();

  return (
    <PortalShell clienteNome={cliente.nome} voltarInterno={`/clientes/${cliente.id}`}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {cliente.avatar_url && <AvatarImage src={cliente.avatar_url} alt={cliente.nome} />}
            <AvatarFallback className="bg-brand-100 text-brand-800">{cliente.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">{cliente.nome}</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe o planejamento de conteúdo, os processos e os roteiros da sua conta.
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-1 border-b border-border">
          {ABAS.map(({ valor, rotulo, icone: Icone }) => (
            <Link
              key={valor}
              href={`?tab=${valor}`}
              className={cn(
                "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                aba === valor
                  ? "border-brand-700 text-brand-900"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icone size={16} />
              {rotulo}
            </Link>
          ))}
        </nav>

        {aba === "calendario" && <ClientCalendar clientId={cliente.id} mes={mes} aba="calendario" />}
        {aba === "processos" && <ClientMaterials clientId={cliente.id} tipo="processo" />}
        {aba === "roteiros" && <ClientMaterials clientId={cliente.id} tipo="roteiro" />}
      </div>
    </PortalShell>
  );
}
