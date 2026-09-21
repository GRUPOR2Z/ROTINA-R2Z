import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CORES_TAREFA } from "@/lib/task-colors";

export function ColorSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <Select name="cor" defaultValue={defaultValue}>
      <SelectTrigger id="cor" className="w-full">
        <SelectValue placeholder="Sem cor" />
      </SelectTrigger>
      <SelectContent>
        {CORES_TAREFA.map((c) => (
          <SelectItem key={c.key} value={c.key}>
            <span className={`mr-1.5 inline-block h-2.5 w-2.5 rounded-full ${c.dot}`} />
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
