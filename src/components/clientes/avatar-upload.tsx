"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { enviarFotoCliente } from "@/app/clientes/actions";

/** Foto do cliente clicável: passa o mouse, aparece a câmera; escolheu
 * a imagem, ela já é enviada (sem o campo "Escolher ficheiro" do
 * navegador). */
export function AvatarUpload({ clientId, nome, url }: { clientId: string; nome: string; url: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={enviarFotoCliente.bind(null, clientId)}>
      <label className="group relative block cursor-pointer" title={url ? "Trocar foto" : "Adicionar foto"}>
        <Avatar className="size-20 ring-4 ring-white">
          {url && <AvatarImage src={url} alt={nome} />}
          <AvatarFallback className="bg-brand-100 text-xl font-semibold text-brand-800">
            {nome.trim().slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <Sobreposicao />
        <input
          type="file"
          name="foto"
          accept="image/*"
          className="sr-only"
          onChange={(e) => e.target.files?.length && formRef.current?.requestSubmit()}
        />
      </label>
    </form>
  );
}

function Sobreposicao() {
  const { pending } = useFormStatus();
  return (
    <span
      className={`absolute inset-0 flex items-center justify-center rounded-full bg-brand-950/55 text-white transition-opacity ${
        pending ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      }`}
    >
      {pending ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
    </span>
  );
}
