# Relatório — MVP completo + Fase 2 (exceto integrações)

Grupo R2Z OS · Doc. 2 §5 (prioridades). Escopo combinado: construir tudo
dos documentos **menos as integrações com n8n e Kommo**, que entram depois.

## 1. Aplicar no banco (obrigatório)

As migrations abaixo **não foram aplicadas** — não há acesso ao banco nesta
sessão. Rode no Supabase → **SQL Editor**, **nesta ordem**, uma por vez:

| Ordem | Arquivo | O que cria |
|---|---|---|
| 1 | `0019_mvp_complementos.sql` | `audit_logs` (+ triggers), `documents` + bucket privado `documents`, subtarefas/vínculos em `tasks`, campos novos em `processes`, `process_suggestions` |
| 2 | `0020_projetos.sql` | `projects`, `project_members`, `project_deliverables`, `project_processes`, `tasks.project_id` |
| 3 | `0021_decisoes_reunioes.sql` | `meetings` (+ participantes, encaminhamentos), `decisions` (+ participantes) |
| 4 | `0022_melhorias.sql` | `improvement_items`, função `is_gestor_ou_admin()` |
| 5 | `0023_onboarding.sql` | trilhas, etapas, inscrições, progresso (+ trigger de conclusão) |
| 6 | `0024_alertas.sql` | `alerts`, `alert_preferences`, função `gerar_alertas()` |
| 7 | `0025_ia.sql` | `ai_reports`, `ai_findings`, `ai_finding_comments` (+ trigger de alerta) |

A ordem importa: a 0022 cria `is_gestor_ou_admin()`, que a 0023, a 0024 e a 0025 usam. Depois de aplicar,
`node scripts/check-schema.mjs` confere se todas as tabelas existem.

> O SQL foi revisado, mas **não foi executado contra um Postgres real**.
> Se alguma migration der erro no SQL Editor, copie a mensagem para corrigirmos.

## 2. O que foi construído

**Fechando o MVP**
- Tarefas: subtarefas, anexos/evidências, histórico de alterações, vínculo com
  projeto/processo/KPI/OKR, regra "prazo ou justificativa" (Doc. 2 §4)
- Calendário: visões dia, semana e mês
- Processos: problemas comuns, links, revisão periódica, substituto, processo
  crítico, sugestões de alteração (não mexem na versão publicada)
- Configurações (admin): áreas, usuários/papéis, registro de ações
- Dashboard: filtros por período/área/responsável, alertas, projetos ativos,
  última análise da IA
- KPI: validade do último valor pela periodicidade; tarefas vinculadas
- Busca global (barra lateral)

**Fase 2**
- Projetos (lista + Kanban, andamento, entregas, equipe, riscos)
- Diário de decisões e reuniões (encaminhamento → tarefa)
- Banco de melhorias (impacto × esforço, → tarefa ou iniciativa de OKR)
- Onboarding (trilhas por cargo, etapas, mentor, progresso)
- Central de alertas (gerados pelo banco, idempotentes, com histórico)
- Grupo R2Z IA: telas e banco prontos; relatórios chegam pelo n8n depois
- Equipe: carga de trabalho, dependência de uma pessoa só

## 3. Decisões de projeto

- **Iniciativas de OKR** = tarefas/melhorias/decisões vinculadas ao OKR, sem
  tabela `initiatives` separada — segue a simplificação de OKR já adotada.
- **`process_steps`** não foi criada: o passo a passo continua em texto
  (simplicidade antes de complexidade, Doc. 1 §6).
- **Histórico** por trigger genérico (`registrar_auditoria`), não por código
  em cada action — nenhuma alteração escapa, mesmo feita fora do app.
- **Alertas** são calculados no banco (`gerar_alertas()`, trava de 5 min) ao
  abrir o dashboard/central. Quando o n8n entrar, ele chama a mesma função em
  horário fixo.
- **IA**: só `service_role` escreve relatórios; achados nascem "pendentes" e
  só viram tarefa depois de validados por uma pessoa (Doc. 1 §6).
- **Anexos** em bucket privado, download por URL assinada de 60s.

## 4. Fica para depois

- Integração n8n (endpoint de relatórios da IA, agendamento de alertas,
  importação de KPIs) e Kommo — combinado.
- Fase 3: busca semântica e detecção de anomalias (dependem da IA/n8n).
  A análise de capacidade básica (carga por pessoa) já existe.
- Clientes — Fase D (compartilhamento externo).
- Realtime (hoje as telas atualizam ao navegar/salvar).

## 5. Testes

`npm run build` ✅ · `npx tsc --noEmit` ✅ · `npm run lint` ✅ ·
`npm run test` ✅ (88 testes, 19 arquivos — novos: documentos, auditoria,
período, processos, projetos, melhorias, onboarding, alertas, IA, equipe,
busca, validade de KPI).

**Não testado**: fluxos ponta a ponta contra o banco real (dependem das
migrations aplicadas) e RLS com usuários de papéis diferentes.
