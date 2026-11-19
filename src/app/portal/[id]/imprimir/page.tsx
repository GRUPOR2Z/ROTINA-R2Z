import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/portal/print-button";
import { getCurrentProfile } from "@/lib/current-profile";
import { createClient } from "@/lib/supabase/server";
import { DIAS_SEMANA, MESES, dateKey, getMonthGrid, paramDoMes } from "@/lib/calendar";
import { infoStatus, rotuloRedeFormato } from "@/lib/conteudo";

/** Calendário do mês pronto para virar PDF (A4 deitado): grade + lista
 * de posts com a marca. Serve para a equipe e para o próprio cliente
 * (o RLS limita o cliente ao que é dele). */
export default async function ImprimirCalendarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { id } = await params;
  const { mes } = await searchParams;
  if (!(await getCurrentProfile())) redirect("/login");

  const hoje = new Date();
  const mesParam = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : paramDoMes(hoje.getFullYear(), hoje.getMonth() + 1);
  const [ano, mesNumero] = mesParam.split("-").map(Number);
  const dias = getMonthGrid(ano, mesNumero);

  const supabase = await createClient();
  const [{ data: cliente }, { data }] = await Promise.all([
    supabase.from("clients").select("id, nome").eq("id", id).maybeSingle(),
    supabase
      .from("calendar_events")
      .select("id, titulo, data, horario, rede, formato, status")
      .eq("client_id", id)
      .gte("data", `${mesParam}-01`)
      .lte("data", dateKey(new Date(ano, mesNumero, 0)))
      .order("data")
      .order("horario", { ascending: true, nullsFirst: false }),
  ]);
  if (!cliente) notFound();
  const posts = data ?? [];

  const porDia = new Map<string, typeof posts>();
  for (const p of posts) porDia.set(p.data, [...(porDia.get(p.data) ?? []), p]);
  // só as semanas que têm dias do mês (a grade completa pode ter 6 linhas)
  const semanas: Date[][] = [];
  for (let i = 0; i < dias.length; i += 7) {
    const semana = dias.slice(i, i + 7);
    if (semana.some((d) => d.getMonth() + 1 === mesNumero)) semanas.push(semana);
  }

  return (
    <div className="min-h-screen flex-1 bg-white text-[#14211d]">
      <style>{`@page { size: A4 landscape; margin: 12mm; } @media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

      <div className="no-print flex items-center justify-between gap-3 border-b border-border bg-brand-50 px-6 py-3 text-sm">
        <span className="text-brand-800">
          Na janela de impressão, escolha <strong>Salvar como PDF</strong> como destino.
        </span>
        <PrintButton />
      </div>

      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 p-6 print:max-w-none print:p-0">
        <header className="flex items-center justify-between gap-4 rounded-xl bg-brand-900 px-6 py-4 text-white">
          <div>
            <p className="text-[10px] font-medium tracking-[0.18em] text-mint uppercase">Calendário de conteúdo</p>
            <h1 className="text-2xl font-semibold text-white">
              {cliente.nome} · {MESES[mesNumero - 1]} {ano}
            </h1>
          </div>
          <Image src="/logo-r2z-branco.png" alt="Grupo R2Z" width={298} height={170} className="w-12" priority />
        </header>

        <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-[#e2e8e4] text-xs">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="border-b border-[#e2e8e4] bg-brand-50 px-2 py-1.5 text-center font-medium text-brand-700">
              {d}
            </div>
          ))}
          {semanas.flat().map((dia, i) => {
            const doMes = dia.getMonth() + 1 === mesNumero;
            const lista = doMes ? (porDia.get(dateKey(dia)) ?? []) : [];
            return (
              <div
                key={dateKey(dia)}
                className={`flex min-h-[86px] flex-col gap-1 border-[#e2e8e4] p-1.5 ${i % 7 ? "border-l" : ""} ${i >= 7 ? "border-t" : ""} ${doMes ? "" : "bg-[#f7f9f8]"}`}
              >
                <span className={`text-[11px] ${doMes ? "text-[#64748b]" : "text-transparent"}`}>{dia.getDate()}</span>
                {lista.map((p) => (
                  <div key={p.id} className={`rounded px-1.5 py-1 text-[10px] leading-tight break-inside-avoid ${infoStatus(p.status).chip}`}>
                    <p className="font-medium">
                      {p.horario ? `${p.horario.slice(0, 5)} · ` : ""}
                      {p.titulo}
                    </p>
                    {rotuloRedeFormato(p.rede, p.formato) && <p className="opacity-80">{rotuloRedeFormato(p.rede, p.formato)}</p>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <section className="break-before-page">
          <h2 className="mb-2 text-sm font-semibold text-brand-900">Posts do mês ({posts.length})</h2>
          {posts.length === 0 ? (
            <p className="text-sm text-[#64748b]">Nenhum post programado para este mês.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#e2e8e4] text-left text-xs text-[#64748b]">
                  <th className="py-2 pr-3 font-medium">Data</th>
                  <th className="py-2 pr-3 font-medium">Tema</th>
                  <th className="py-2 pr-3 font-medium">Rede · formato</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => {
                  const d = new Date(`${p.data}T00:00:00`);
                  const st = infoStatus(p.status);
                  return (
                    <tr key={p.id} className="border-b border-[#eef2ef] break-inside-avoid">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}{" "}
                        <span className="text-[#64748b]">
                          {d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                          {p.horario ? ` · ${p.horario.slice(0, 5)}` : ""}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-medium">{p.titulo}</td>
                      <td className="py-2 pr-3 text-[#64748b]">{rotuloRedeFormato(p.rede, p.formato) ?? "—"}</td>
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${st.chip}`}>{st.rotulo}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <p className="text-center text-[10px] text-[#64748b]">
          Grupo R2Z · gerado em {hoje.toLocaleDateString("pt-BR")}
        </p>
      </div>
    </div>
  );
}
