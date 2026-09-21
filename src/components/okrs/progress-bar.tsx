export function ProgressBar({ progresso }: { progresso: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${progresso}%` }}
      />
    </div>
  );
}
