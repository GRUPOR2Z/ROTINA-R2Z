"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import type { Opcao } from "@/lib/opcoes";

export type { Opcao };

/** Select de formulario com rotulo. Passa `items` pro Root pra que o
 * gatilho mostre o rotulo (e nao o id cru) quando ja vem um valor
 * padrao -- sem isso o base-ui exibe o value literal ate abrir a lista. */
export function SelectField({
  name,
  label,
  options,
  defaultValue,
  placeholder = "Selecionar",
  emptyLabel,
  className,
}: {
  name: string;
  label?: string;
  options: Opcao[];
  defaultValue?: string | null;
  placeholder?: string;
  /** quando definido, adiciona uma opcao "vazia" (envia "") no topo */
  emptyLabel?: string;
  className?: string;
}) {
  const todas = emptyLabel ? [{ value: "", label: emptyLabel }, ...options] : options;

  return (
    <div className={className ?? "flex flex-col gap-2"}>
      {label && <Label htmlFor={name}>{label}</Label>}
      <Select name={name} defaultValue={defaultValue ?? undefined} items={todas}>
        <SelectTrigger id={name} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {todas.map((o) => (
            <SelectItem key={o.value || "__vazio"} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

