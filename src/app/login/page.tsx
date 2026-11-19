"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/layout/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setCarregando(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setCarregando(false);
      setErro("E-mail ou senha incorretos.");
      return;
    }

    // login de cliente vai direto para o portal
    const { data: perfil } = await supabase
      .from("profiles")
      .select("roles(nome)")
      .eq("id", data.user.id)
      .maybeSingle();
    const papel = (perfil?.roles as unknown as { nome: string } | null)?.nome;

    router.push(papel === "cliente" ? "/portal" : "/");
    router.refresh();
  }

  return (
    <AuthShell title="Entrar" description="Acesse sua conta para continuar">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                className="h-10 bg-white"
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                className="h-10 bg-white"
                id="senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            {erro && (
              <p role="alert" className="text-sm text-destructive">
                {erro}
              </p>
            )}
            <Button type="submit" disabled={carregando} className="mt-2 h-10 w-full">
              {carregando ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link href="/signup" className="font-medium text-brand-700 hover:underline">
              Criar conta
            </Link>
          </p>
    </AuthShell>
  );
}
