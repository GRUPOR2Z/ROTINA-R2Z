# Relatório — Fase 1 (Fundação do sistema)

Grupo R2Z OS · Documento 4, §7 (entregáveis) e §8 (forma de trabalho)

## 1. Instalação

```bash
git clone https://github.com/GRUPOR2Z/ROTINA-R2Z.git rotina
cd rotina
npm install
cp .env.example .env.local
```

Preencha o `.env.local`:

| Variável | Onde pegar | Obrigatória para rodar `npm run dev`? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (secreta) | Só para os endpoints `/api/integrations/n8n/*` |
| `N8N_WEBHOOK_SECRET` | Você define uma string qualquer | Só para os endpoints `/api/integrations/n8n/*` |

## 2. Execução local

```bash
npm run dev        # http://localhost:3000
npm run test        # testes unitários (Vitest)
npm run test:e2e    # testes de ponta a ponta (Playwright)
npm run build        # build de produção
npm run lint        # eslint
```

**Antes de logar pela primeira vez:** o banco ainda não tem as tabelas.
Rode a migration abaixo — veja a seção 5 (pendências) para o motivo de
não ter sido aplicada automaticamente.

## 3. Decisões arquiteturais desta fase

- **Next.js App Router + Supabase (`@supabase/ssr`)**, com três clientes
  separados (`src/lib/supabase/client.ts` para o browser, `server.ts`
  para Server Components/Actions, `middleware.ts` para renovar a sessão
  a cada requisição) — é o padrão recomendado pela própria Supabase
  para App Router, evita expor a sessão incorretamente entre client e
  server.
- **`profiles` desacoplado de `auth.users`**: um trigger
  (`handle_new_user`) cria a linha em `profiles` automaticamente no
  primeiro login, com `role_id` = colaborador por padrão. Isso segue o
  princípio "toda tarefa deve ter responsável" — ninguém entra no
  sistema sem um perfil rastreável.
- **RLS com função auxiliar `is_admin()`**: em vez de repetir a
  subquery de papel em cada policy, uma função `security definer`
  centraliza a checagem — mais fácil de auditar e testar.
- **Rotas de integração (`/api/integrations/n8n/*`) fora do middleware
  de autenticação de usuário**: elas usam autenticação própria (segredo
  compartilhado via header `Authorization`), porque quem chama é o n8n,
  não um usuário logado no navegador.
- **`integration_logs` só acessível via `service_role`**: nenhuma
  policy de `authenticated` foi criada de propósito — só o backend
  (com a service role key) grava ali, nunca o cliente.
- **shadcn/ui**: `CardTitle` do componente gerado renderiza um `<div>`,
  não um heading semântico. Troquei por um `<h1>` explícito na tela de
  login para manter acessibilidade básica (Doc. 4 §5) — vale revisar
  se isso se repete em outras telas.

## 4. Funcionalidades implementadas

| Item do backlog (blueprint, §06) | Status |
|---|---|
| 01 — Autenticação (login/logout) | ✅ Feito e testado (e2e) |
| 03 — Permissões essenciais (RLS) | ✅ Schema e policies criados — falta aplicar no banco e testar com usuário real |
| 04 — Layout base (sidebar, navegação, estados globais) | ✅ Feito |
| 05 — Estrutura inicial n8n (webhook + health) | ✅ Feito e com idempotência |
| 02 — Cadastro de áreas e membros | ⏳ Não iniciado — próximo da fila |

Páginas placeholder ("Em construção") criadas para `/rotinas`,
`/processos`, `/kpis`, `/okrs`, `/equipe` e `/configuracoes` — só para
a navegação não ter links quebrados; sem lógica ainda.

## 5. Pendências e limitações conhecidas

- **A migration `supabase/migrations/0001_init.sql` ainda não foi
  aplicada no seu projeto Supabase.** Eu não tenho a senha do banco
  nem a `service_role` key nesta sessão (por design — combinamos não
  passar segredos pelo chat). Para aplicar:
  1. Abra o Supabase → **SQL Editor**
  2. Cole o conteúdo de `supabase/migrations/0001_init.sql`
  3. Rode
  Depois disso, login funciona de fato (hoje ele tentaria autenticar
  mas o perfil não existiria).
- **Nenhum usuário existe ainda.** Crie você e o Akyllys em Supabase →
  Authentication → Users → *Add user* (ou habilite signup, se
  preferir). O primeiro login de cada um cria o `profile` com papel
  "colaborador" — depois disso, promova os dois para "administrador"
  rodando no SQL Editor:
  ```sql
  update public.profiles set role_id = (select id from public.roles where nome = 'administrador')
  where email in ('seu-email@r2z.com.br', 'email-do-akyllys@r2z.com.br');
  ```
- **`SUPABASE_SERVICE_ROLE_KEY` e `N8N_WEBHOOK_SECRET` estão em branco**
  no seu `.env.local` — os endpoints de integração retornam 401/500
  até você preencher.
- **RLS ainda não foi testado com um usuário real** — só a policy foi
  escrita e revisada, não validada contra o banco (que ainda não
  existe). Isso é o primeiro teste a rodar assim que a migration for
  aplicada.
- Item 02 do backlog (cadastro de áreas/membros pela interface) não foi
  implementado — hoje isso só é possível direto no Supabase.

## 6. Testes executados

| Teste | Ferramenta | Resultado |
|---|---|---|
| `npm run build` (compila + typecheck todas as rotas) | Next.js | ✅ Passou |
| `npm run lint` | ESLint | ✅ Sem erros |
| `EmptyState` renderiza título e descrição | Vitest + Testing Library | ✅ Passou |
| Login com credenciais inválidas exibe mensagem de erro | Playwright (e2e, Chromium) | ✅ Passou |

**Não testado ainda** (depende da migration aplicada e de usuários
reais existirem): login com credenciais válidas, RLS bloqueando um
colaborador de escrever em `areas`, e os endpoints de `/api/integrations/n8n/*` com um segredo real.

## 7. Próximo passo sugerido

Aplicar a migration, criar os dois usuários e promover a
administrador (seção 5) — só então dá pra validar o critério de
aceitação "um usuário autorizado consegue fazer login" de ponta a
ponta. Depois disso, o próximo item do backlog é o cadastro de áreas e
membros pela própria interface (item 02).
