# Grupo R2Z OS

Sistema interno de gestão operacional do Grupo R2Z: rotinas, processos documentados, KPIs, OKRs e, mais adiante, análises geradas por IA via n8n.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS + [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com) — Postgres, Auth, Storage, Realtime, Row Level Security
- Vitest + Testing Library (testes unitários/componentes) · Playwright (fluxos críticos)

## Desenvolvimento

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env.local` e preencha as credenciais do Supabase antes de rodar.

## Documentação

A arquitetura, o modelo de dados, as políticas de acesso e o backlog do MVP estão consolidados no blueprint técnico do projeto (link compartilhado no time).
