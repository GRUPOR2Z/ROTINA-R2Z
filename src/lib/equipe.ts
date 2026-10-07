import { dateKey, somarDias } from "@/lib/calendar";

type TarefaCarga = {
  responsavel_id: string | null;
  status: string;
  prazo: string | null;
  concluida_em: string | null;
};

export type Carga = { abertas: number; atrasadas: number; bloqueadas: number; concluidas30d: number };

/** Carga de trabalho por pessoa (analise basica de capacidade). */
export function calcularCarga(tarefas: TarefaCarga[], hoje = new Date()) {
  const hojeKey = dateKey(hoje);
  const corte30 = somarDias(hoje, -30).toISOString();
  const porPessoa = new Map<string, Carga>();

  for (const t of tarefas) {
    if (!t.responsavel_id) continue;
    const c = porPessoa.get(t.responsavel_id) ?? { abertas: 0, atrasadas: 0, bloqueadas: 0, concluidas30d: 0 };
    if (t.status === "concluida") {
      if (t.concluida_em && t.concluida_em >= corte30) c.concluidas30d++;
    } else {
      c.abertas++;
      if (t.status === "bloqueada") c.bloqueadas++;
      if (t.prazo && t.prazo < hojeKey) c.atrasadas++;
    }
    porPessoa.set(t.responsavel_id, c);
  }
  return porPessoa;
}

/** Media de tarefas abertas por pessoa, considerando so quem tem alguma.
 * Serve de referencia pra destacar quem esta muito acima. */
export function mediaAbertas(cargas: Map<string, Carga>) {
  const valores = [...cargas.values()].map((c) => c.abertas).filter((n) => n > 0);
  if (valores.length === 0) return 0;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

export function sobrecarregado(carga: Carga | undefined, media: number) {
  if (!carga || media === 0) return false;
  return carga.abertas >= 5 && carga.abertas > media * 1.5;
}

type ProcessoDependencia = {
  id: string;
  titulo: string;
  status: string;
  critico: boolean;
  responsavel_id: string | null;
  substituto_id: string | null;
};

/** Doc. 2: "identificar dependencias operacionais de uma unica pessoa".
 * Conta, por responsavel, os processos ativos sem substituto definido. */
export function dependenciasDeUmaPessoa(processos: ProcessoDependencia[]) {
  const porPessoa = new Map<string, { semSubstituto: ProcessoDependencia[]; criticos: number }>();
  for (const p of processos) {
    if (p.status === "arquivado" || !p.responsavel_id || p.substituto_id) continue;
    const atual = porPessoa.get(p.responsavel_id) ?? { semSubstituto: [], criticos: 0 };
    atual.semSubstituto.push(p);
    if (p.critico) atual.criticos++;
    porPessoa.set(p.responsavel_id, atual);
  }
  return porPessoa;
}
