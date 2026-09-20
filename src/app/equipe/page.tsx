import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

function iniciais(nome: string | null, email: string | null) {
  const base = nome?.trim() || email || "?";
  return base.slice(0, 2).toUpperCase();
}

export default async function EquipePage() {
  const supabase = await createClient();

  const { data: membros } = await supabase
    .from("profiles")
    .select("id, nome, email, cargo, areas(nome), roles(nome), member_tags(id, tag)")
    .eq("ativo", true)
    .order("nome");

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipe</h1>
          <p className="text-sm text-muted-foreground">
            Clique em uma pessoa para ver rotina, competências e resultados.
          </p>
        </div>

        {!membros || membros.length === 0 ? (
          <EmptyState
            title="Ninguém cadastrado ainda"
            description="Os perfis aparecem aqui assim que fizerem o primeiro login."
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {membros.map((m) => {
              const area = (m.areas as unknown as { nome: string } | null)?.nome;
              const papel = (m.roles as unknown as { nome: string } | null)?.nome;
              const tags = (m.member_tags ?? []) as { id: string; tag: string }[];

              return (
                <Link
                  key={m.id}
                  href={`/equipe/${m.id}`}
                  className="flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{iniciais(m.nome, m.email)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {m.nome || m.email}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.cargo || papel || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {area && (
                      <Badge variant="secondary" className="text-[11px]">
                        {area}
                      </Badge>
                    )}
                    {tags.slice(0, 3).map((t) => (
                      <Badge key={t.id} variant="outline" className="text-[11px]">
                        {t.tag}
                      </Badge>
                    ))}
                    {tags.length > 3 && (
                      <Badge variant="outline" className="text-[11px]">
                        +{tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
