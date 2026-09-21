function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function dateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Grade de 42 dias (6 semanas) cobrindo o mês, com dias de padding
 * dos meses vizinhos — igual à grade do Google Agenda. */
export function getMonthGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const startWeekday = firstOfMonth.getDay();
  const gridStart = new Date(year, month - 1, 1 - startWeekday);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }
  return days;
}

export type Frequencia = "diaria" | "semanal" | "mensal";

/** Calcula a proxima data de uma tarefa recorrente. `prazo` no formato
 * "YYYY-MM-DD". Usa horario local (meia-noite) para nao deslocar o
 * dia por causa de fuso horario. */
export function proximaData(prazo: string, frequencia: Frequencia) {
  const d = new Date(`${prazo}T00:00:00`);
  if (frequencia === "diaria") d.setDate(d.getDate() + 1);
  if (frequencia === "semanal") d.setDate(d.getDate() + 7);
  if (frequencia === "mensal") d.setMonth(d.getMonth() + 1);
  return dateKey(d);
}

/** Quantas ocorrências futuras ficam visíveis de uma vez, tipo uma
 * agenda de verdade — não só "a próxima depois que eu concluir". */
export const HORIZONTE_RECORRENCIA: Record<Frequencia, number> = {
  diaria: 14,
  semanal: 8,
  mensal: 6,
};

/** `quantidade` datas seguintes a partir de `dataInicial` (exclusiva),
 * avançando pela frequência a cada uma. */
export function gerarProximasDatas(dataInicial: string, frequencia: Frequencia, quantidade: number) {
  const datas: string[] = [];
  let atual = dataInicial;
  for (let i = 0; i < quantidade; i++) {
    atual = proximaData(atual, frequencia);
    datas.push(atual);
  }
  return datas;
}

export function mesAnterior(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

export function proximoMes(year: number, month: number) {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

export function paramDoMes(year: number, month: number) {
  return `${year}-${pad(month)}`;
}

export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
