import ExcelJS from "exceljs";

export const MAX_IMPORT_ROWS = 1000;

export interface ImportRecord {
  row: number; // número de fila en la planilla (1 = primera fila)
  name: string;
  trade: string;
  phone: string;
  notes: string;
  placeId?: string;
}

export interface ImportRowError {
  row: number;
  reason: string;
}

export interface ParsedImport {
  records: ImportRecord[];
  errors: ImportRowError[];
  missingColumns: string[];
  truncated: boolean;
}

const ALIASES = {
  // Incluye los títulos en inglés de las exportaciones de herramientas de mapas
  // (title, category, phone, address).
  name: ["nombre", "negocio", "nombre del negocio", "razon social", "contacto", "prestador", "empresa", "title", "name", "business name"],
  trade: ["oficio", "rubro", "categoria", "servicio", "especialidad", "profesion", "category", "categories"],
  phone: ["celular", "telefono", "whatsapp", "tel", "movil", "numero", "cel", "telefono celular", "phone", "phone number", "mobile"],
  notes: ["notas", "nota", "observaciones", "comentarios", "direccion", "barrio", "zona", "address", "notes"],
  placeId: ["place id"],
} as const;
type Field = keyof typeof ALIASES;

function normalizeHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchField(header: string): Field | null {
  const h = normalizeHeader(header);
  if (!h) return null;
  for (const field of Object.keys(ALIASES) as Field[]) {
    if ((ALIASES[field] as readonly string[]).includes(h)) return field;
  }
  for (const field of Object.keys(ALIASES) as Field[]) {
    if ((ALIASES[field] as readonly string[]).some((a) => h.startsWith(a + " ") || h.endsWith(" " + a))) return field;
  }
  return null;
}

/**
 * Convierte filas crudas en prestadores. La fila de encabezados es la primera
 * (dentro de las 10 primeras) que tenga una columna de teléfono reconocible.
 * Si se indica `defaultTrade`, reemplaza la columna de oficio (útil cuando la
 * columna trae categorías de Google como "Taller de reparación de automóviles").
 */
export function mapRows(rows: string[][], defaultTrade = ""): ParsedImport {
  const headerIndex = rows.slice(0, 10).findIndex((r) => r.some((c) => matchField(c) === "phone"));
  if (headerIndex < 0) {
    return { records: [], errors: [], missingColumns: ["teléfono o celular"], truncated: false };
  }
  const columns: Partial<Record<Field, number>> = {};
  rows[headerIndex].forEach((cell, i) => {
    const f = matchField(cell);
    if (f && columns[f] === undefined) columns[f] = i;
  });

  const missingColumns: string[] = [];
  if (columns.name === undefined) missingColumns.push("nombre");
  if (columns.trade === undefined && !defaultTrade.trim()) missingColumns.push("oficio (o elegí uno para todo el archivo)");
  if (missingColumns.length) return { records: [], errors: [], missingColumns, truncated: false };

  const get = (r: string[], f: Field) => (columns[f] === undefined ? "" : (r[columns[f]!] ?? "").trim());
  const records: ImportRecord[] = [];
  const errors: ImportRowError[] = [];
  let truncated = false;

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.every((c) => !c.trim())) continue;
    if (records.length + errors.length >= MAX_IMPORT_ROWS) {
      truncated = true;
      break;
    }
    const row = i + 1;
    const name = get(r, "name");
    const phone = get(r, "phone");
    const trade = defaultTrade.trim() || get(r, "trade");
    if (!name) errors.push({ row, reason: "falta el nombre" });
    else if (!phone) errors.push({ row, reason: "falta el teléfono" });
    else if (!trade) errors.push({ row, reason: "falta el oficio" });
    else {
      const placeId = get(r, "placeId");
      records.push({ row, name, trade, phone, notes: get(r, "notes"), ...(placeId ? { placeId } : {}) });
    }
  }
  return { records, errors, missingColumns: [], truncated };
}

/** CSV simple con comillas; detecta separador "," o ";" (Excel en español usa ";"). */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function cellToString(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  // Los teléfonos suelen venir como número: evitar notación científica.
  if (typeof v === "number") return Number.isInteger(v) ? v.toFixed(0) : String(v);
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("result" in v && v.result !== undefined) return String(v.result);
    if ("text" in v) return String(v.text);
  }
  return cell.text ?? "";
}

/** Lee la primera hoja de un .xlsx o un .csv y devuelve filas de texto. */
export async function readSpreadsheet(data: ArrayBuffer, filename: string): Promise<string[][]> {
  if (/\.csv$/i.test(filename)) return parseCsv(new TextDecoder("utf-8").decode(data));
  if (!/\.xlsx$/i.test(filename)) throw new Error("formato");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data);
  const sheet = wb.worksheets[0];
  if (!sheet) return [];
  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: true }, (r, n) => {
    const values: string[] = [];
    for (let c = 1; c <= r.cellCount; c++) values.push(cellToString(r.getCell(c)));
    rows[n - 1] = values;
  });
  return Array.from(rows, (r) => r ?? []);
}
