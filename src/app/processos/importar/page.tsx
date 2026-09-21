import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SubmitButton } from "@/components/ui/submit-button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAreasEMembros } from "@/lib/lookups";
import { importarProcesso } from "../actions";

export default async function ImportarProcessoPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const { areas, membros } = await getAreasEMembros();

  return (
    <AppShell>
      <div className="flex max-w-xl flex-col gap-6">
        <div>
          <Link href="/processos" className="text-sm text-muted-foreground hover:text-foreground">
            ← Processos
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Importar processo</h1>
          <p className="text-sm text-muted-foreground">
            Envie um .docx ou .pdf — o texto vira um rascunho no campo &quot;Passo a passo&quot;, pronto
            para você reorganizar nos campos certos antes de publicar.
          </p>
        </div>

        {erro && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {erro}
          </p>
        )}

        <form action={importarProcesso} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="arquivo">Arquivo (.docx ou .pdf)</Label>
            <input
              id="arquivo"
              name="arquivo"
              type="file"
              accept=".docx,.pdf"
              required
              className="rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-sm"
            />
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

          <SubmitButton className="mt-2 self-start" pendingText="Importando…">
            Importar
          </SubmitButton>
        </form>
      </div>
    </AppShell>
  );
}
