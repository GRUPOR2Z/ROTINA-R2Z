"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const TIPOS_CAMPO = [
  { value: "texto", label: "Texto" },
  { value: "numero", label: "Número" },
  { value: "moeda", label: "Moeda (R$)" },
  { value: "data", label: "Data" },
  { value: "booleano", label: "Sim/Não" },
  { value: "select", label: "Seleção única" },
  { value: "multi_select", label: "Seleção múltipla" },
  { value: "usuario", label: "Pessoa da equipe" },
  { value: "url", label: "Link" },
] as const;

/** Select de "Tipo de campo" + o campo "Opções" que só faz sentido
 * (e só aparece) quando o tipo escolhido é seleção única ou múltipla
 * -- evita a caixa de "valor:rótulo" solta e sem contexto pros outros
 * 7 tipos, que só confundia. Usado tanto no "+ Adicionar propriedade"
 * inline quanto em /clientes/propriedades. */
export function PropertyTypeAndOptionsFields({ idPrefix = "" }: { idPrefix?: string }) {
  const [tipoCampo, setTipoCampo] = useState<string>("texto");
  const precisaDeOpcoes = tipoCampo === "select" || tipoCampo === "multi_select";

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}tipo_campo`}>Tipo de campo</Label>
        <Select name="tipo_campo" defaultValue="texto" onValueChange={(v) => setTipoCampo(v ?? "texto")}>
          <SelectTrigger id={`${idPrefix}tipo_campo`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_CAMPO.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {precisaDeOpcoes && (
        <div className="col-span-2 flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}opcoes`}>Opções da lista</Label>
          <p className="text-xs text-muted-foreground">
            Uma opção por linha, no formato <code>valor:rótulo</code> — o rótulo é o texto que aparece pro
            time (ex: <code>ativo:Ativo</code>). Se digitar só uma palavra, ela vira o rótulo também.
          </p>
          <Textarea
            id={`${idPrefix}opcoes`}
            name="opcoes"
            placeholder={"ativo:Ativo\ninativo:Inativo"}
            className="min-h-24"
          />
        </div>
      )}
    </>
  );
}
