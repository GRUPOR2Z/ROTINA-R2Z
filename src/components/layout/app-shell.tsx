import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { NavLinks, SettingsLink } from "@/components/layout/nav-links";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function iniciais(nome: string | null | undefined, email: string | null | undefined) {
  const base = nome?.trim() || email || "?";
  return base.slice(0, 2).toUpperCase();
}

export async function AppShell({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("nome, email, cargo")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col justify-between border-r bg-muted/20 p-4">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-semibold">Grupo R2Z OS</p>
            <p className="text-xs text-muted-foreground">Gestão operacional</p>
          </div>
          <NavLinks />
        </div>

        <div className="flex flex-col gap-2">
          <SettingsLink />

          <div className="flex items-center gap-3 border-t pt-4">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{iniciais(profile?.nome, profile?.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{profile?.nome || user?.email}</p>
              <p className="truncate text-xs text-muted-foreground">{profile?.cargo || "—"}</p>
            </div>
            <form action="/logout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
