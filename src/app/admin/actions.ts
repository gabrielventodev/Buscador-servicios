"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addProspect, markOptOut } from "@/lib/prospects";
import { STATUS_LABEL } from "@/lib/status";

export async function addProspectAction(formData: FormData) {
  const source = formData.get("source") === "referido" ? "referido" : "manual";
  const result = await addProspect({
    name: String(formData.get("name") ?? ""),
    trade: String(formData.get("trade") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    source,
  });
  if (result.ok) redirect(`/admin?msg=${encodeURIComponent(`Agregado: ${result.prospect.name}`)}`);
  const text =
    result.error === "duplicado"
      ? `Ese número ya está cargado (${result.existing.name}, ${STATUS_LABEL[result.existing.status]}).`
      : result.error === "telefono_invalido"
        ? "No pude leer el teléfono. Usá código de área, por ejemplo 3489 15 123456."
        : "Faltan nombre u oficio.";
  redirect(`/admin?err=${encodeURIComponent(text)}`);
}

export async function optOutAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (Number.isInteger(id)) await markOptOut({ id }, "manual");
  revalidatePath("/admin");
}
