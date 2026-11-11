import { sql } from "./db";
import { config } from "./config";
import { generateCode } from "./code";
import { normalizeArPhone } from "./phone";
import { pickVariant, type Variant } from "./message";
import { sourcesFor, type OptOutReason, type Status } from "./status";

export interface Prospect {
  id: number;
  code: string;
  name: string;
  trade: string;
  phone: string;
  source: "manual" | "referido" | "places";
  variant: Variant;
  status: Status;
  opt_out_reason: OptOutReason | null;
  notes: string | null;
  created_at: Date;
  sent_at: Date | null;
  interested_at: Date | null;
  registered_at: Date | null;
  opted_out_at: Date | null;
}

/** Quien no abrió el enlace en N días pasa a Baja, sin segundo intento. */
export async function expireStale(): Promise<number> {
  const rows = await sql`
    UPDATE prospects
       SET status = 'baja', opt_out_reason = 'sin_respuesta', opted_out_at = now()
     WHERE status = 'enviado'
       AND sent_at < now() - make_interval(days => ${config.noResponseDays})
    RETURNING id`;
  return rows.length;
}

export type AddResult =
  | { ok: true; prospect: Prospect }
  | { ok: false; error: "datos_incompletos" | "telefono_invalido" }
  | { ok: false; error: "duplicado"; existing: Pick<Prospect, "name" | "status"> };

export async function addProspect(input: {
  name: string;
  trade: string;
  phone: string;
  source?: "manual" | "referido";
  notes?: string;
}): Promise<AddResult> {
  const name = input.name.trim();
  const trade = input.trade.trim();
  if (!name || !trade) return { ok: false, error: "datos_incompletos" };
  const phone = normalizeArPhone(input.phone, config.defaultAreaCode);
  if (!phone) return { ok: false, error: "telefono_invalido" };

  const [existing] = await sql<Pick<Prospect, "name" | "status">[]>`
    SELECT name, status FROM prospects WHERE phone = ${phone}`;
  if (existing) return { ok: false, error: "duplicado", existing };

  const [{ n }] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM prospects`;
  const [prospect] = await sql<Prospect[]>`
    INSERT INTO prospects (code, name, trade, phone, source, variant, notes)
    VALUES (${generateCode()}, ${name}, ${trade}, ${phone}, ${input.source ?? "manual"},
            ${pickVariant(n)}, ${input.notes?.trim() || null})
    ON CONFLICT (phone) DO NOTHING
    RETURNING *`;
  if (!prospect) {
    const [dup] = await sql<Pick<Prospect, "name" | "status">[]>`
      SELECT name, status FROM prospects WHERE phone = ${phone}`;
    return { ok: false, error: "duplicado", existing: dup };
  }
  return { ok: true, prospect };
}

export async function todaysBatch() {
  const [{ sent_today }] = await sql<{ sent_today: number }[]>`
    SELECT count(*)::int AS sent_today FROM prospects
     WHERE sent_at >= date_trunc('day', now())`;
  const remaining = Math.max(0, config.dailyBatchSize - sent_today);
  const items = await sql<Prospect[]>`
    SELECT * FROM prospects WHERE status = 'pendiente'
     ORDER BY created_at, id LIMIT ${remaining}`;
  return { sentToday: sent_today, remaining, items };
}

export async function getById(id: number): Promise<Prospect | undefined> {
  const [p] = await sql<Prospect[]>`SELECT * FROM prospects WHERE id = ${id}`;
  return p;
}

export async function getByCode(code: string): Promise<Prospect | undefined> {
  const [p] = await sql<Prospect[]>`SELECT * FROM prospects WHERE code = ${code}`;
  return p;
}

/** Marca como enviado. Devuelve el prospecto solo si estaba pendiente. */
export async function markSent(id: number): Promise<Prospect | undefined> {
  const [p] = await sql<Prospect[]>`
    UPDATE prospects SET status = 'enviado', sent_at = now()
     WHERE id = ${id} AND status = ANY(${sourcesFor("enviado")})
    RETURNING *`;
  return p;
}

export async function markOptOut(where: { id: number } | { code: string }, reason: OptOutReason) {
  const from = sourcesFor("baja");
  const rows =
    "id" in where
      ? await sql`UPDATE prospects SET status = 'baja', opt_out_reason = ${reason}, opted_out_at = now()
                   WHERE id = ${where.id} AND status = ANY(${from}) RETURNING id`
      : await sql`UPDATE prospects SET status = 'baja', opt_out_reason = ${reason}, opted_out_at = now()
                   WHERE code = ${where.code} AND status = ANY(${from}) RETURNING id`;
  return rows.length > 0;
}

/**
 * Interesado = tocó "Me sumo". No se marca al abrir el enlace, porque WhatsApp
 * abre el enlace para armar la vista previa y eso daría falsos "interesados".
 */
export async function markInterested(code: string) {
  const rows = await sql`
    UPDATE prospects SET status = 'interesado', interested_at = now()
     WHERE code = ${code} AND status = ANY(${sourcesFor("interesado")})
    RETURNING id`;
  return rows.length > 0;
}

export type RegisterResult = { ok: true } | { ok: false; error: "telefono_invalido" | "estado_invalido" | "datos_incompletos" };

export async function registerProvider(
  code: string,
  input: { name: string; trade: string; zone: string; whatsapp: string; consentVersion: string },
): Promise<RegisterResult> {
  const name = input.name.trim();
  const trade = input.trade.trim();
  const zone = input.zone.trim();
  if (!name || !trade || !zone) return { ok: false, error: "datos_incompletos" };
  const whatsapp = normalizeArPhone(input.whatsapp, config.defaultAreaCode);
  if (!whatsapp) return { ok: false, error: "telefono_invalido" };

  return sql.begin(async (tx) => {
    const [p] = await tx<Prospect[]>`
      UPDATE prospects SET status = 'registrado', registered_at = now()
       WHERE code = ${code} AND status = ANY(${sourcesFor("registrado")})
      RETURNING *`;
    if (!p) return { ok: false, error: "estado_invalido" } as const;
    await tx`
      INSERT INTO providers (prospect_id, name, trade, zone, whatsapp, consent_version)
      VALUES (${p.id}, ${name}, ${trade}, ${zone}, ${whatsapp}, ${input.consentVersion})
      ON CONFLICT (whatsapp) DO UPDATE
        SET name = EXCLUDED.name, trade = EXCLUDED.trade, zone = EXCLUDED.zone,
            consent_version = EXCLUDED.consent_version, consent_at = now()`;
    return { ok: true } as const;
  });
}

/** Tocaron "Me sumo" pero no terminaron el registro: recordatorio manual. */
export async function stalledInterested(days = 3) {
  return sql<Prospect[]>`
    SELECT * FROM prospects WHERE status = 'interesado'
       AND interested_at < now() - make_interval(days => ${days})
     ORDER BY interested_at`;
}

export async function listProspects(status?: Status) {
  return status
    ? sql<Prospect[]>`SELECT * FROM prospects WHERE status = ${status} ORDER BY created_at DESC, id DESC LIMIT 200`
    : sql<Prospect[]>`SELECT * FROM prospects ORDER BY created_at DESC, id DESC LIMIT 200`;
}

export interface MetricRow {
  key: string;
  sent: number;
  interested: number;
  registered: number;
  declined: number;
  no_response: number;
}

async function metricsBy(column: "trade" | "variant") {
  const col = sql(column);
  return sql<MetricRow[]>`
    SELECT ${col} AS key,
           count(*) FILTER (WHERE sent_at IS NOT NULL)::int AS sent,
           count(*) FILTER (WHERE interested_at IS NOT NULL)::int AS interested,
           count(*) FILTER (WHERE status = 'registrado')::int AS registered,
           count(*) FILTER (WHERE status = 'baja' AND opt_out_reason <> 'sin_respuesta')::int AS declined,
           count(*) FILTER (WHERE opt_out_reason = 'sin_respuesta')::int AS no_response
      FROM prospects
     GROUP BY ${col}
     ORDER BY sent DESC, key`;
}

export async function metrics() {
  const [byTrade, byVariant] = await Promise.all([metricsBy("trade"), metricsBy("variant")]);
  return { byTrade, byVariant };
}
