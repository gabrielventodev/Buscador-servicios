import { config } from "@/lib/config";
import { formatPhone } from "@/lib/phone";
import {
  expireStale,
  listProspects,
  metrics,
  stalledInterested,
  todaysBatch,
  type MetricRow,
  type Prospect,
} from "@/lib/prospects";
import { REASON_LABEL, STATUSES, STATUS_LABEL, type Status } from "@/lib/status";
import { addProspectAction, optOutAction } from "./actions";
import { ImportForm } from "./ImportForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel · Buscador de servicios" };

const TRADES = ["Plomero", "Electricista", "Mecánico", "Gasista", "Albañil", "Pintor", "Cerrajero", "Técnico de aire acondicionado"];

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: process.env.APP_TIMEZONE ?? "America/Argentina/Buenos_Aires",
});
const fmt = (d: Date | null) => (d ? dateFmt.format(d) : "");
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "–");

function OptOutButton({ id }: { id: number }) {
  return (
    <form action={optOutAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button className="btn small danger" type="submit">Baja</button>
    </form>
  );
}

function MetricsTable({ rows, label }: { rows: MetricRow[]; label: string }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{label}</th>
            <th className="num">Enviados</th>
            <th className="num">Tocaron “Me sumo”</th>
            <th className="num">Registrados</th>
            <th className="num">No les interesa</th>
            <th className="num">Sin respuesta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td>{r.key}</td>
              <td className="num">{r.sent}</td>
              <td className="num">{r.interested} ({pct(r.interested, r.sent)})</td>
              <td className="num">{r.registered} ({pct(r.registered, r.sent)})</td>
              <td className="num">{r.declined}</td>
              <td className="num">{r.no_response}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={6} className="muted">Todavía no hay datos.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function statusCell(p: Prospect) {
  return (
    <>
      <span className="tag">{STATUS_LABEL[p.status]}</span>
      {p.opt_out_reason && <span className="muted"> · {REASON_LABEL[p.opt_out_reason]}</span>}
    </>
  );
}

export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; msg?: string; err?: string }>;
}) {
  const { estado, msg, err } = await searchParams;
  const filter = STATUSES.includes(estado as Status) ? (estado as Status) : undefined;

  const expired = await expireStale();
  const [batch, stats, stalled, all] = await Promise.all([
    todaysBatch(),
    metrics(),
    stalledInterested(),
    listProspects(filter),
  ]);

  return (
    <main>
      <h1>Panel de reclutamiento</h1>
      <p className="muted">
        {config.cityName} · tanda de {config.dailyBatchSize} por día · baja automática a los {config.noResponseDays} días sin respuesta
      </p>
      {msg && <div className="notice">{msg}</div>}
      {err && <div className="notice error">{err}</div>}
      {expired > 0 && <div className="notice">{expired} prestador(es) pasaron a Baja por no responder en {config.noResponseDays} días.</div>}

      <h2>Tanda de hoy</h2>
      <p>
        Enviados hoy: <strong>{batch.sentToday}</strong> · quedan <strong>{batch.remaining}</strong>.{" "}
        <span className="muted">Tocá “Enviar”, se abre WhatsApp con el mensaje listo y lo mandás vos.</span>
      </p>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Nombre</th><th>Oficio</th><th>Teléfono</th><th>Mensaje</th><th></th></tr>
          </thead>
          <tbody>
            {batch.items.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.trade}</td>
                <td>{formatPhone(p.phone)}</td>
                <td><span className="tag">Variante {p.variant}</span></td>
                <td>
                  <div className="row">
                    {/* <a> y no <Link>: Link precarga la ruta y la marcaría como enviada. */}
                    <a className="btn small primary" href={`/admin/enviar/${p.id}`} target="_blank" rel="noopener">
                      Enviar por WhatsApp
                    </a>
                    <OptOutButton id={p.id} />
                  </div>
                </td>
              </tr>
            ))}
            {batch.items.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  {batch.remaining === 0 ? "Tanda de hoy completa." : "No hay prestadores pendientes. Cargá más abajo."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {stalled.length > 0 && (
        <>
          <h2>Para recordar</h2>
          <p className="muted">Tocaron “Me sumo” hace más de 3 días y no terminaron el registro. Recordatorio a mano, una sola vez.</p>
          <div className="card table-wrap">
            <table>
              <thead><tr><th>Nombre</th><th>Oficio</th><th>Teléfono</th><th>Tocó “Me sumo”</th><th></th></tr></thead>
              <tbody>
                {stalled.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.trade}</td>
                    <td><a href={`https://wa.me/${p.phone}`} target="_blank" rel="noopener">{formatPhone(p.phone)}</a></td>
                    <td>{fmt(p.interested_at)}</td>
                    <td><OptOutButton id={p.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2>Agregar prestador</h2>
      <form action={addProspectAction} className="card stack">
        <div className="grid">
          <div>
            <label htmlFor="name">Nombre o negocio</label>
            <input id="name" name="name" required />
          </div>
          <div>
            <label htmlFor="trade">Oficio</label>
            <input id="trade" name="trade" list="trades" required />
            <datalist id="trades">
              {TRADES.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
          <div>
            <label htmlFor="phone">Celular</label>
            <input id="phone" name="phone" inputMode="tel" placeholder="3489 15 123456" required />
          </div>
          <div>
            <label htmlFor="source">Origen</label>
            <select id="source" name="source" defaultValue="manual">
              <option value="manual">Lo cargo yo</option>
              <option value="referido">Referido por otro prestador</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="notes">Notas</label>
          <input id="notes" name="notes" placeholder="Opcional: de dónde lo sacaste, barrio, etc." />
        </div>
        <div><button className="btn primary" type="submit">Agregar a la lista</button></div>
      </form>

      <h2>Importar desde Excel</h2>
      <ImportForm trades={TRADES} />

      <h2>Resultados por oficio</h2>
      <div className="card"><MetricsTable rows={stats.byTrade} label="Oficio" /></div>

      <h2>Resultados por variante de mensaje</h2>
      <p className="muted">A: pedidos con fotos y datos completos. B: gratis los primeros meses.</p>
      <div className="card"><MetricsTable rows={stats.byVariant} label="Variante" /></div>

      <h2>Todos los prestadores</h2>
      <p className="filters">
        <a href="/admin">Todos</a>
        {STATUSES.map((s) => (
          <a key={s} href={`/admin?estado=${s}`}>{STATUS_LABEL[s]}</a>
        ))}
      </p>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Nombre</th><th>Oficio</th><th>Teléfono</th><th>Estado</th><th>Enviado</th><th>Notas</th><th></th></tr>
          </thead>
          <tbody>
            {all.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.trade}</td>
                <td>{formatPhone(p.phone)}</td>
                <td>{statusCell(p)}</td>
                <td>{fmt(p.sent_at)}</td>
                <td className="muted">{p.notes}</td>
                <td>{p.status !== "baja" && p.status !== "registrado" && <OptOutButton id={p.id} />}</td>
              </tr>
            ))}
            {all.length === 0 && <tr><td colSpan={7} className="muted">Sin prestadores en este estado.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
