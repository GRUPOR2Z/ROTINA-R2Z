"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/layout/auth-shell";

export default function SignupPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setCarregando(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    });

    setCarregando(false);

    if (error) {
      setErro(
        error.message.includes("already registered")
          ? "Já existe uma conta com esse e-mail."
          : "Não foi possível criar a conta. Tente novamente.",
      );
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    // "Confirm email" ainda ligado no Supabase — sem sessão imediata.
    setAguardandoConfirmacao(true);
  }

  if (aguardandoConfirmacao) {
    return (
      <AuthShell
        title="Quase lá"
        description={<>Enviamos um e-mail de confirmação para {email}. Clique no link antes de entrar.</>}
      >
        <Link href="/login" className="text-sm font-medium text-brand-700 hover:underline">
          Voltar para o login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Criar conta" description="Seu perfil é criado automaticamente.">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                className="h-10 bg-white"
                id="nome"
                autoComplete="name"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
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
                autoComplete="new-password"
                minLength={6}
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
              {carregando ? "Criando..." : "Criar conta"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-brand-700 hover:underline">
              Entrar
            </Link>
          </p>
    </AuthShell>
  );
}
