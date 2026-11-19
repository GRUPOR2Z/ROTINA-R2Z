/** Carregamento do portal: só a barra da marca (sem o menu interno). */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background" aria-busy="true" aria-label="Carregando">
      <div className="h-16 bg-brand-900" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="h-8 w-64 animate-pulse rounded-md bg-brand-100" />
        <div className="h-10 w-80 max-w-full animate-pulse rounded-md bg-brand-100/70" />
        <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}
