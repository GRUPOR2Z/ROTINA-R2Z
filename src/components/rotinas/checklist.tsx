"use client";

import { useTransition } from "react";
import { useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adicionarChecklistItem, alternarChecklistItem } from "@/app/rotinas/actions";

type Item = { id: string; descricao: string; concluido: boolean };

export function Checklist({ taskId, itens }: { taskId: string; itens: Item[] }) {
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-2">
      {itens.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum item no checklist.</p>
      )}
      {itens.map((item) => (
        <label key={item.id} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={item.concluido}
            onCheckedChange={(checked) =>
              startTransition(() => {
                alternarChecklistItem(taskId, item.id, checked === true);
              })
            }
          />
          <span className={item.concluido ? "text-muted-foreground line-through" : ""}>
            {item.descricao}
          </span>
        </label>
      ))}

      <form
        ref={formRef}
        action={async (formData) => {
          await adicionarChecklistItem(taskId, formData);
          formRef.current?.reset();
        }}
        className="mt-2 flex gap-2"
      >
        <Input name="descricao" placeholder="Novo item" className="h-8 text-sm" />
        <Button type="submit" size="sm" variant="outline">
          Adicionar
        </Button>
      </form>
    </div>
  );
}
