export const CORES_TAREFA = [
  {
    key: "azul",
    label: "Azul",
    dot: "bg-blue-500",
    chip: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  },
  {
    key: "verde",
    label: "Verde",
    dot: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  {
    key: "amarelo",
    label: "Amarelo",
    dot: "bg-amber-500",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  },
  {
    key: "laranja",
    label: "Laranja",
    dot: "bg-orange-500",
    chip: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  },
  {
    key: "vermelho",
    label: "Vermelho",
    dot: "bg-red-500",
    chip: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  },
  {
    key: "roxo",
    label: "Roxo",
    dot: "bg-violet-500",
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
  },
  {
    key: "rosa",
    label: "Rosa",
    dot: "bg-pink-500",
    chip: "bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-300",
  },
  {
    key: "cinza",
    label: "Cinza",
    dot: "bg-slate-400",
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  },
] as const;

export type CorTarefa = (typeof CORES_TAREFA)[number]["key"];

export function infoCor(cor: string | null) {
  return CORES_TAREFA.find((c) => c.key === cor) ?? null;
}
