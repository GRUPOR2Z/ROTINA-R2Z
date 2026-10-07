/** Lista de checkboxes de pessoas; envia um campo `name` por marcado
 * (lido no servidor com `lista(formData, name)`). */
export function ParticipantsField({
  membros,
  selecionados = [],
  name = "participantes",
  label = "Participantes",
}: {
  membros: { id: string; nome: string | null; email: string | null }[];
  selecionados?: string[];
  name?: string;
  label?: string;
}) {
  const marcados = new Set(selecionados);
  return (
    <fieldset className="flex flex-col">
      <legend className="mb-2 text-sm font-medium leading-none">{label}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border p-3">
        {membros.length === 0 && <span className="text-sm text-muted-foreground">Nenhum membro cadastrado.</span>}
        {membros.map((m) => (
          <label key={m.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name={name} value={m.id} defaultChecked={marcados.has(m.id)} className="h-4 w-4" />
            {m.nome || m.email}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
