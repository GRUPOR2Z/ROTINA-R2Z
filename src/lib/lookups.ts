import { createClient } from "@/lib/supabase/server";

export async function getAreasEMembros() {
  const supabase = await createClient();

  const [{ data: areas }, { data: membros }] = await Promise.all([
    supabase.from("areas").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("profiles").select("id, nome, email").eq("ativo", true).order("nome"),
  ]);

  return {
    areas: areas ?? [],
    membros: membros ?? [],
  };
}

/** Opcoes pros selects de vinculo (tarefa -> processo/KPI/OKR/projeto). */
export async function getVinculosTarefa() {
  const supabase = await createClient();

  const [{ data: processos }, { data: kpis }, { data: okrs }, { data: projetos }] = await Promise.all([
    supabase.from("processes").select("id, titulo").neq("status", "arquivado").order("titulo"),
    supabase.from("kpis").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("okrs").select("id, titulo").eq("ativo", true).order("titulo"),
    supabase.from("projects").select("id, nome").neq("status", "cancelado").order("nome"),
  ]);

  return {
    processos: (processos ?? []).map((p) => ({ value: p.id, label: p.titulo })),
    kpis: (kpis ?? []).map((k) => ({ value: k.id, label: k.nome })),
    okrs: (okrs ?? []).map((o) => ({ value: o.id, label: o.titulo })),
    projetos: (projetos ?? []).map((p) => ({ value: p.id, label: p.nome })),
  };
}

export async function getReunioesRecentes() {
  const supabase = await createClient();
  const { data } = await supabase.from("meetings").select("id, titulo, data").order("data", { ascending: false }).limit(50);
  return (data ?? []).map((r) => ({ value: r.id, label: `${r.titulo} (${r.data.split("-").reverse().join("/")})` }));
}
