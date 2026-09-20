"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddNoteForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await action(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-2 rounded-lg border p-3"
    >
      <Select name="tipo" defaultValue="resultado">
        <SelectTrigger className="h-8 w-36 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="resultado">Resultado</SelectItem>
          <SelectItem value="falha">Falha</SelectItem>
        </SelectContent>
      </Select>
      <Textarea
        name="texto"
        placeholder="O que aconteceu?"
        required
        className="min-h-20 text-sm"
      />
      <Button type="submit" size="sm" className="self-end">
        Registrar
      </Button>
    </form>
  );
}
