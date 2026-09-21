import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { criarCiclo } from "../actions";

export default function NovoCicloPage() {
  return (
    <AppShell>
      <div className="flex max-w-lg flex-col gap-6">
        <div>
          <Link href="/okrs" className="text-sm text-muted-foreground hover:text-foreground">
            ← OKRs
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Novo ciclo</h1>
        </div>

        <form action={criarCiclo} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" placeholder="Ex: Q1 2027" required autoFocus />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select name="tipo" defaultValue="trimestral">
              <SelectTrigger id="tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="data_inicio">Início</Label>
              <Input id="data_inicio" name="data_inicio" type="date" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="data_fim">Fim</Label>
              <Input id="data_fim" name="data_fim" type="date" required />
            </div>
          </div>

          <SubmitButton className="mt-2 self-start" pendingText="Criando…">
            Criar ciclo
          </SubmitButton>
        </form>
      </div>
    </AppShell>
  );
}
