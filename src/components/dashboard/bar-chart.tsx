type BarItem = { label: string; value: number; colorClass: string };

export function StatusBarChart({ items }: { items: BarItem[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-xs text-muted-foreground">{item.label}</span>
          <div className="h-2.5 flex-1 rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${item.colorClass}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
