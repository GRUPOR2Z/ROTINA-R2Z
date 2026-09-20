import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Algo deu errado",
  description = "Não foi possível carregar esses dados. Tente novamente.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 py-16 text-center">
      <p className="text-sm font-medium text-destructive">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
