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
import { criarTarefa } from "../actions";

export default async function NovaTarefaPage() {
  const { areas, membros } = await getAreasEMembros();

  return (
    <AppShell>
      <div className="flex max-w-xl flex-col gap-6">
        <div>
          <Link href="/rotinas" className="text-sm text-muted-foreground hover:text-foreground">
            ← Rotinas
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nova tarefa</h1>
        </div>

        <form action={criarTarefa} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" name="titulo" required autoFocus />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" name="descricao" className="min-h-24" />
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
                  <SelectValue placeholder="Você" />
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select name="prioridade" defaultValue="media">
                <SelectTrigger id="prioridade" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="prazo">Prazo</Label>
              <Input id="prazo" name="prazo" type="date" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="horario">Horário (opcional)</Label>
              <Input id="horario" name="horario" type="time" />
            </div>
          </div>

          <Button type="submit" className="mt-2 self-start">
            Criar tarefa
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
