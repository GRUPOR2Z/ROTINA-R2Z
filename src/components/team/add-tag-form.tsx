"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddTagForm({
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
      className="flex gap-2"
    >
      <Input
        name="tag"
        placeholder="Nova competência"
        maxLength={40}
        required
        className="h-8 w-40 text-sm"
      />
      <Button type="submit" size="sm" variant="outline">
        Adicionar
      </Button>
    </form>
  );
}
