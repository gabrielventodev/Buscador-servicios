"use server";

import { revalidatePath } from "next/cache";
import { importProspects, type ImportSummary } from "@/lib/prospects";
import { mapRows, readSpreadsheet } from "@/lib/spreadsheet";

export type ImportState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | ({ status: "done"; truncated: boolean } & ImportSummary);

export async function importAction(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Elegí un archivo .xlsx o .csv." };

  let rows: string[][];
  try {
    rows = await readSpreadsheet(await file.arrayBuffer(), file.name);
  } catch (e) {
    return {
      status: "error",
      message:
        e instanceof Error && e.message === "formato"
          ? "Formato no soportado. Guardá la planilla como .xlsx o .csv."
          : "No pude leer el archivo. Probá guardarlo de nuevo como .xlsx.",
    };
  }

  const parsed = mapRows(rows, String(formData.get("defaultTrade") ?? ""));
  if (parsed.missingColumns.length) {
    return {
      status: "error",
      message: `No encontré estas columnas: ${parsed.missingColumns.join(", ")}. La primera fila tiene que tener los títulos, por ejemplo Nombre, Oficio, Celular.`,
    };
  }
  const summary = await importProspects(parsed.records);
  summary.invalid.push(...parsed.errors);
  summary.invalid.sort((a, b) => a.row - b.row);
  revalidatePath("/admin");
  return { status: "done", truncated: parsed.truncated, ...summary };
}
