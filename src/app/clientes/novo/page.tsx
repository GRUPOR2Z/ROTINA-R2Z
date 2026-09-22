import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarCliente } from "../actions";

export default function NovoClientePage() {
  return (
    <AppShell>
      <div className="flex max-w-md flex-col gap-6">
        <div>
          <Link href="/clientes" className="text-sm text-muted-foreground hover:text-foreground">
            ← Clientes
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Novo cliente</h1>
          <p className="text-sm text-muted-foreground">
            Propriedades, calendário, tarefas e processos entram depois, na página do cliente.
          </p>
        </div>

        <form action={criarCliente} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" required autoFocus />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tipo_cliente">Tipo de cliente</Label>
            <Input id="tipo_cliente" name="tipo_cliente" placeholder="ex: clínica, e-commerce (opcional)" />
          </div>

          <SubmitButton className="mt-2 self-start" pendingText="Criando…">
            Criar cliente
          </SubmitButton>
        </form>
      </div>
    </AppShell>
  );
}
