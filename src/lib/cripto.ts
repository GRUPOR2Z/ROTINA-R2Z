import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** Criptografia das senhas da aba Acessos (AES-256-GCM).
 * A chave (CREDENCIAIS_CHAVE, 32 bytes em base64) existe só no servidor;
 * o banco guarda apenas "v1:iv:tag:conteudo" (tudo em base64). */
function chave() {
  const bruta = process.env.CREDENCIAIS_CHAVE;
  const buf = bruta ? Buffer.from(bruta, "base64") : null;
  if (!buf || buf.length !== 32) {
    throw new Error("CREDENCIAIS_CHAVE ausente ou inválida (precisa ter 32 bytes em base64).");
  }
  return buf;
}

export function cifrar(texto: string) {
  const iv = randomBytes(12);
  const cifra = createCipheriv("aes-256-gcm", chave(), iv);
  const conteudo = Buffer.concat([cifra.update(texto, "utf8"), cifra.final()]);
  return ["v1", iv.toString("base64"), cifra.getAuthTag().toString("base64"), conteudo.toString("base64")].join(":");
}

export function decifrar(guardado: string) {
  const [versao, iv, tag, conteudo] = guardado.split(":");
  if (versao !== "v1" || !iv || !tag || !conteudo) throw new Error("Formato de senha desconhecido.");
  const decifra = createDecipheriv("aes-256-gcm", chave(), Buffer.from(iv, "base64"));
  decifra.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decifra.update(Buffer.from(conteudo, "base64")), decifra.final()]).toString("utf8");
}
