import { notFound, redirect } from "next/navigation";
import { isValidCode } from "@/lib/code";
import { formatPhone } from "@/lib/phone";
import { getByCode } from "@/lib/prospects";
import { registerAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Registro · Buscador de servicios" };

const ERRORS: Record<string, string> = {
  consentimiento: "Para sumarte tenés que aceptar el aviso de privacidad.",
  telefono_invalido: "No pudimos leer el número de WhatsApp. Probá con código de área, por ejemplo 3489 123456.",
  datos_incompletos: "Completá nombre, oficio y zona.",
  estado_invalido: "Este enlace ya no está activo.",
};

export default async function Registro({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { code } = await params;
  const { e } = await searchParams;
  if (!isValidCode(code)) notFound();
  const p = await getByCode(code);
  if (!p) notFound();
  if (p.status === "registrado") redirect(`/p/${code}?r=ok`);

  return (
    <main className="narrow stack">
      <h1>Sumate a la red</h1>
      {e && ERRORS[e] && <div className="notice error">{ERRORS[e]}</div>}
      <form action={registerAction} className="stack">
        <input type="hidden" name="code" value={code} />
        <div>
          <label htmlFor="name">Nombre o nombre del negocio</label>
          <input id="name" name="name" required defaultValue={p.name} />
        </div>
        <div>
          <label htmlFor="trade">Oficio</label>
          <input id="trade" name="trade" required defaultValue={p.trade} />
        </div>
        <div>
          <label htmlFor="zone">Zona o barrios donde trabajás</label>
          <input id="zone" name="zone" required placeholder="Ej.: Campana centro, Las Acacias" />
        </div>
        <div>
          <label htmlFor="whatsapp">WhatsApp donde querés recibir pedidos</label>
          <input id="whatsapp" name="whatsapp" required inputMode="tel" defaultValue={formatPhone(p.phone)} />
        </div>
        <div>
          <label style={{ fontWeight: 400 }}>
            <input type="checkbox" name="consent" required />
            Acepto recibir pedidos de trabajo por WhatsApp y el <a href="/privacidad" target="_blank">aviso de privacidad</a>.
          </label>
        </div>
        <button className="btn primary big" type="submit">Registrarme</button>
      </form>
    </main>
  );
}
