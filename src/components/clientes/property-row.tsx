"use client";

import { useState, useTransition } from "react";
import {
  TypeIcon,
  HashIcon,
  DollarSignIcon,
  CalendarIcon,
  CheckSquareIcon,
  ListIcon,
  TagsIcon,
  UserIcon,
  LinkIcon,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  formatarValorPropriedade,
  normalizarValorFormulario,
  opcoesDaPropriedade,
  type DefinicaoPropriedade,
  type TipoCampoPropriedade,
} from "@/lib/client-properties";
import { salvarPropriedadeUnica } from "@/app/clientes/actions";

type Membro = { id: string; nome: string | null; email: string | null };

const ICONES: Record<TipoCampoPropriedade, LucideIcon> = {
  texto: TypeIcon,
  numero: HashIcon,
  moeda: DollarSignIcon,
  data: CalendarIcon,
  booleano: CheckSquareIcon,
  select: ListIcon,
  multi_select: TagsIcon,
  usuario: UserIcon,
  url: LinkIcon,
};

const TIPOS_TEXTO_LIVRE: TipoCampoPropriedade[] = ["texto", "url", "numero", "moeda", "data"];

/** Uma linha da lista de propriedades, estilo Notion: ícone + rótulo à
 * esquerda, valor editável à direita. Cada campo salva sozinho ao
 * mudar (blur pro texto, seleção/checkbox pros demais) -- não tem
 * botão de "salvar tudo". */
export function PropertyRow({
  clientId,
  definicao,
  valorInicial,
  membros,
}: {
  clientId: string;
  definicao: DefinicaoPropriedade;
  valorInicial: unknown;
  membros: Membro[];
}) {
  const [valor, setValor] = useState(valorInicial);
  const [editando, setEditando] = useState(false);
  const [, startTransition] = useTransition();
  const Icone = ICONES[definicao.tipo_campo];

  function salvar(bruto: string | string[] | null) {
    setValor(normalizarValorFormulario(definicao.tipo_campo, bruto));
    startTransition(() => {
      salvarPropriedadeUnica(clientId, definicao.id, definicao.tipo_campo, bruto);
    });
  }

  return (
    <div className="flex items-start gap-3 border-b border-border/60 py-2 text-sm last:border-0">
      <div className="flex w-40 shrink-0 items-center gap-2 pt-1 text-muted-foreground">
        <Icone className="h-4 w-4 shrink-0" />
        <span className="truncate">{definicao.rotulo}</span>
      </div>

      <div className="min-w-0 flex-1">
        {TIPOS_TEXTO_LIVRE.includes(definicao.tipo_campo) &&
          (editando ? (
            <Input
              autoFocus
              type={
                definicao.tipo_campo === "numero" || definicao.tipo_campo === "moeda"
                  ? "number"
                  : definicao.tipo_campo === "data"
                    ? "date"
                    : "text"
              }
              step={definicao.tipo_campo === "moeda" || definicao.tipo_campo === "numero" ? "any" : undefined}
              defaultValue={valor == null ? "" : String(valor)}
              className="h-7 text-sm"
              onBlur={(e) => {
                salvar(e.target.value);
                setEditando(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditando(false);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="min-h-7 w-full rounded px-1.5 py-0.5 text-left transition-colors hover:bg-muted"
            >
              {formatarValorPropriedade(definicao, valor)}
            </button>
          ))}

        {definicao.tipo_campo === "booleano" && (
          <input
            type="checkbox"
            checked={valor === true}
            onChange={(e) => salvar(e.target.checked ? "on" : null)}
            className="h-4 w-4 rounded border-input accent-primary"
          />
        )}

        {definicao.tipo_campo === "select" && (
          <Select value={typeof valor === "string" ? valor : ""} onValueChange={(v) => salvar(v)}>
            <SelectTrigger className="h-7 w-full max-w-56 text-sm">
              <SelectValue placeholder="Vazio" />
            </SelectTrigger>
            <SelectContent>
              {opcoesDaPropriedade(definicao).map((o) => (
                <SelectItem key={o.valor} value={o.valor}>
                  {o.rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {definicao.tipo_campo === "usuario" && (
          <Select value={typeof valor === "string" ? valor : ""} onValueChange={(v) => salvar(v)}>
            <SelectTrigger className="h-7 w-full max-w-56 text-sm">
              <SelectValue placeholder="Vazio" />
            </SelectTrigger>
            <SelectContent>
              {membros.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nome || m.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {definicao.tipo_campo === "multi_select" && (
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {opcoesDaPropriedade(definicao).map((o) => {
              const selecionados = Array.isArray(valor) ? valor.map(String) : [];
              const marcado = selecionados.includes(o.valor);
              return (
                <label key={o.valor} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={(e) => {
                      const proximos = e.target.checked
                        ? [...selecionados, o.valor]
                        : selecionados.filter((v) => v !== o.valor);
                      salvar(proximos);
                    }}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  {o.rotulo}
                </label>
              );
            })}
            {opcoesDaPropriedade(definicao).length === 0 && (
              <span className="text-muted-foreground">Sem opções cadastradas.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
