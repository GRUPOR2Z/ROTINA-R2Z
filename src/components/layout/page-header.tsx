import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  back,
  actions,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      {back && (
        <Link href={back.href} className="text-sm text-muted-foreground hover:text-foreground">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** Abas simples por link (Lista | Calendario | Kanban...). */
export function SubNav({ items, ativo }: { items: { href: string; label: string }[]; ativo: string }) {
  return (
    <div className="mt-1 flex gap-4 text-sm">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={i.href === ativo ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}

export function Section({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function ErroBanner({ erro }: { erro?: string }) {
  if (!erro) return null;
  return (
    <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {erro}
    </p>
  );
}
