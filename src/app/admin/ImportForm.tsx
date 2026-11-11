"use client";

import { useActionState } from "react";
import { importAction, type ImportState } from "./import-action";
import { STATUS_LABEL } from "@/lib/status";

const LIMIT = 1000;

export function ImportForm({ trades }: { trades: string[] }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importAction, { status: "idle" });

  return (
    <div className="card stack">
      <p className="muted">
        La primera fila tiene que tener los títulos. Reconoce columnas como <strong>Nombre</strong>, <strong>Oficio</strong> (o
        Rubro), <strong>Celular</strong> (o Teléfono, WhatsApp) y <strong>Notas</strong>. Hasta {LIMIT} filas por archivo.
        Los números ya cargados se saltean.
      </p>
      <form action={action} className="stack">
        <div className="grid">
          <div>
            <label htmlFor="file">Archivo (.xlsx o .csv)</label>
            <input id="file" name="file" type="file" accept=".xlsx,.csv" required />
          </div>
          <div>
            <label htmlFor="defaultTrade">Oficio para todo el archivo</label>
            <input id="defaultTrade" name="defaultTrade" list="trades-import" placeholder="Solo si no hay columna Oficio" />
            <datalist id="trades-import">
              {trades.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
        </div>
        <div>
          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? "Importando…" : "Importar"}
          </button>
        </div>
      </form>

      {state.status === "error" && <div className="notice error">{state.message}</div>}
      {state.status === "done" && (
        <div className="stack">
          <div className="notice">
            Agregados: <strong>{state.added}</strong> · ya estaban cargados: <strong>{state.duplicates.length}</strong> · con
            errores: <strong>{state.invalid.length}</strong>
            {state.truncated && <> · el archivo tenía más de {LIMIT} filas: se importaron las primeras {LIMIT}</>}
          </div>
          {state.invalid.length > 0 && (
            <details>
              <summary>Filas con errores ({state.invalid.length})</summary>
              <ul>
                {state.invalid.map((e) => (
                  <li key={`i${e.row}`}>Fila {e.row}: {e.reason}</li>
                ))}
              </ul>
            </details>
          )}
          {state.duplicates.length > 0 && (
            <details>
              <summary>Ya estaban cargados ({state.duplicates.length})</summary>
              <ul>
                {state.duplicates.map((d) => (
                  <li key={`d${d.row}`}>Fila {d.row}: {d.name} ({STATUS_LABEL[d.status]})</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
