import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { mapRows, MAX_IMPORT_ROWS, parseCsv, readSpreadsheet } from "./spreadsheet";

describe("mapRows", () => {
  it("reconoce encabezados con tildes, mayúsculas y sinónimos", () => {
    const r = mapRows([
      ["Razón Social", "Rubro", "Teléfono Celular", "Barrio"],
      ["Juan", "Plomero", "3489 15 123456", "Centro"],
    ]);
    expect(r.missingColumns).toEqual([]);
    expect(r.records).toEqual([{ row: 2, name: "Juan", trade: "Plomero", phone: "3489 15 123456", notes: "Centro" }]);
  });

  it("reconoce títulos en inglés de exportaciones de mapas", () => {
    const r = mapRows([
      ["input_id", "link", "title", "category", "address", "phone", "place_id"],
      ["x", "https://maps", "Taller Gino", "Taller mecánico", "Gavazzi 241", "03489 34-7929", "ChIJ"],
    ]);
    expect(r.records).toEqual([
      { row: 2, name: "Taller Gino", trade: "Taller mecánico", phone: "03489 34-7929", notes: "Gavazzi 241", placeId: "ChIJ" },
    ]);
  });

  it("el oficio elegido reemplaza la categoría del archivo", () => {
    const r = mapRows([["title", "category", "phone"], ["Taller Gino", "Taller de reparación de automóviles", "123456"]], "Mecánico");
    expect(r.records[0].trade).toBe("Mecánico");
  });

  it("encuentra el encabezado aunque no esté en la primera fila", () => {
    const r = mapRows([["Listado de prestadores"], [], ["Nombre", "Oficio", "WhatsApp"], ["Ana", "Gasista", "123456"]]);
    expect(r.records).toHaveLength(1);
    expect(r.records[0].row).toBe(4);
  });

  it("usa el oficio por defecto si no hay columna de oficio", () => {
    const r = mapRows([["Nombre", "Celular"], ["Luis", "123456"]], "Electricista");
    expect(r.records[0].trade).toBe("Electricista");
  });

  it("avisa qué columnas faltan", () => {
    expect(mapRows([["Nombre", "Oficio"]]).missingColumns).toEqual(["teléfono o celular"]);
    expect(mapRows([["Nombre", "Celular"]]).missingColumns[0]).toMatch(/^oficio/);
  });

  it("informa filas incompletas y saltea las vacías", () => {
    const r = mapRows([
      ["Nombre", "Oficio", "Celular"],
      ["", "Plomero", "123456"],
      ["", "", ""],
      ["Pedro", "Plomero", ""],
    ]);
    expect(r.records).toEqual([]);
    expect(r.errors).toEqual([
      { row: 2, reason: "falta el nombre" },
      { row: 4, reason: "falta el teléfono" },
    ]);
  });

  it("corta en el máximo de filas", () => {
    const rows = [["Nombre", "Oficio", "Celular"], ...Array.from({ length: MAX_IMPORT_ROWS + 5 }, (_, i) => [`P${i}`, "Pintor", "123456"])];
    const r = mapRows(rows);
    expect(r.records).toHaveLength(MAX_IMPORT_ROWS);
    expect(r.truncated).toBe(true);
  });
});

describe("parseCsv", () => {
  it("detecta punto y coma y respeta comillas", () => {
    expect(parseCsv('﻿Nombre;Oficio;Celular\r\n"Pérez; e hijos";Plomero;"3489 ""15"" 123456"\r\n')).toEqual([
      ["Nombre", "Oficio", "Celular"],
      ["Pérez; e hijos", "Plomero", '3489 "15" 123456'],
    ]);
  });
  it("usa coma si es el separador", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });
});

describe("readSpreadsheet", () => {
  it("lee un .xlsx con teléfonos numéricos sin notación científica", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Hoja1");
    ws.addRow(["Nombre", "Oficio", "Celular"]);
    ws.addRow(["Juan", "Plomero", 5493489123456]);
    ws.addRow([{ richText: [{ text: "Ana " }, { text: "Gas" }] }, "Gasista", "3489 15 222222"]);
    const buf = await wb.xlsx.writeBuffer();
    const rows = await readSpreadsheet(buf as ArrayBuffer, "lista.xlsx");
    expect(rows[1]).toEqual(["Juan", "Plomero", "5493489123456"]);
    expect(rows[2][0]).toBe("Ana Gas");
  });

  it("rechaza formatos no soportados", async () => {
    await expect(readSpreadsheet(new ArrayBuffer(0), "lista.xls")).rejects.toThrow("formato");
  });
});
