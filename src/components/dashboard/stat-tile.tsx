import Link from "next/link";

export function StatTile({
  label,
  value,
  href,
  tone = "neutral",
}: {
  label: string;
  value: number;
  href?: string;
  tone?: "neutral" | "critical";
}) {
  const content = (
    <div className="flex flex-col gap-1 rounded-lg border bg-card p-4">
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
      <p className={`text-sm ${tone === "critical" && value > 0 ? "text-destructive" : "text-muted-foreground"}`}>
        {label}
      </p>
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} className="transition-opacity hover:opacity-80">
      {content}
    </Link>
  );
}
