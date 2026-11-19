import Image from "next/image";
import type { ReactNode } from "react";

/** Moldura das telas de entrada (login/cadastro): painel verde da marca à
 * esquerda e o formulário à direita — mesmo visual do dashboard comercial. */
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-1 bg-background">
      <section className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-brand-900 p-12 text-white lg:flex">
        {/* marca d'água do símbolo */}
        <Image
          src="/logo-r2z-branco.png"
          alt=""
          width={298}
          height={170}
          className="pointer-events-none absolute -right-24 -bottom-16 w-[560px] opacity-[0.04]"
        />
        <Image src="/logo-r2z-branco.png" alt="Grupo R2Z" width={298} height={170} className="w-16" priority />
        <div className="relative max-w-md">
          <p className="mb-3 text-xs font-medium tracking-[0.2em] text-mint uppercase">Grupo R2Z</p>
          <p className="text-4xl leading-tight font-semibold">Gestão operacional</p>
          <p className="mt-4 text-brand-200">
            Planejar, executar, registrar, medir e melhorar: rotinas, processos, indicadores e projetos no mesmo
            lugar.
          </p>
        </div>
        <p className="relative text-xs text-brand-300">© {new Date().getFullYear()} Grupo R2Z</p>
      </section>

      <section className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Image
              src="/logo-r2z-verde.png"
              alt="Grupo R2Z"
              width={298}
              height={170}
              className="mb-6 w-14 lg:hidden"
              priority
            />
            <h1 className="text-2xl font-semibold">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
