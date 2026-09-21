import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAreasEMembros } from "@/lib/lookups";
import { criarProcesso } from "../actions";

export default async function NovoProcessoPage() {
  const { areas, membros } = await getAreasEMembros();

  return (
    <AppShell>
      <div className="flex max-w-2xl flex-col gap-6">
        <div>
          <Link href="/processos" className="text-sm text-muted-foreground hover:text-foreground">
            ← Processos
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Novo processo</h1>
          <p className="text-sm text-muted-foreground">
            Começa como rascunho — publique quando estiver pronto para virar a versão oficial.
          </p>
        </div>

        <form action={criarProcesso} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" name="titulo" required autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="area_id">Área</Label>
              <Select name="area_id">
                <SelectTrigger id="area_id" className="w-full">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="responsavel_id">Responsável</Label>
              <Select name="responsavel_id">
                <SelectTrigger id="responsavel_id" className="w-full">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {membros.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome || m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="objetivo">Objetivo</Label>
            <Textarea id="objetivo" name="objetivo" placeholder="Por que esse processo existe" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="pre_requisitos">Pré-requisitos</Label>
            <Textarea id="pre_requisitos" name="pre_requisitos" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="gatilho">Gatilho</Label>
            <Textarea id="gatilho" name="gatilho" placeholder="O que dispara esse processo" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="entradas">Entradas</Label>
            <Textarea id="entradas" name="entradas" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="passo_a_passo">Passo a passo</Label>
            <Textarea id="passo_a_passo" name="passo_a_passo" className="min-h-32" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="saidas">Saídas</Label>
            <Textarea id="saidas" name="saidas" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="criterios_conclusao">Critérios de conclusão</Label>
            <Textarea id="criterios_conclusao" name="criterios_conclusao" />
          </div>

          <Button type="submit" className="mt-2 self-start">
            Criar processo
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
