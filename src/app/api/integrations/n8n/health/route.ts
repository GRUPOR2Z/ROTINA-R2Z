import { NextResponse } from "next/server";
import { verificaSegredoN8n } from "@/lib/integration-auth";

export async function GET(request: Request) {
  if (!verificaSegredoN8n(request)) {
    return NextResponse.json(
      { status: "erro", mensagem: "Não autenticado." },
      { status: 401 },
    );
  }

  return NextResponse.json({ status: "ok", autenticado: true });
}
