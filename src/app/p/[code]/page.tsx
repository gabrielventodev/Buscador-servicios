import { notFound } from "next/navigation";
import { isValidCode } from "@/lib/code";
import { config } from "@/lib/config";
import { getByCode } from "@/lib/prospects";
import { declineAction, joinAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sumate · Buscador de servicios" };

// Abrir esta página NO cambia ningún estado: WhatsApp la abre para armar la
// vista previa del enlace. Solo cuentan los botones.
export default async function Invitation({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const { code } = await params;
  const { r } = await searchParams;
  if (!isValidCode(code)) notFound();
  const p = await getByCode(code);
  if (!p) notFound();

  if (r === "ok" || p.status === "registrado") {
    return (
      <main className="narrow stack">
        <h1>¡Listo, {p.name}!</h1>
        <p>Ya estás en la red. Cuando un vecino pida un trabajo de {p.trade.toLowerCase()} en tu zona, te llega por WhatsApp con fotos y detalles para que cotices.</p>
        <p className="muted">Si en algún momento no querés recibir más pedidos, avisanos por WhatsApp y te damos de baja.</p>
      </main>
    );
  }

  if (r === "baja") {
    return (
      <main className="narrow stack">
        <h1>Entendido</h1>
        <p>No te vamos a escribir más. Gracias por responder.</p>
        <p className="muted">Si cambiás de idea, podés volver a este mismo enlace y sumarte.</p>
        <form action={joinAction}>
          <input type="hidden" name="code" value={code} />
          <button className="btn small" type="submit">Me sumo igual</button>
        </form>
      </main>
    );
  }

  return (
    <main className="narrow stack">
      <h1>Pedidos de trabajo de vecinos de {config.cityName}</h1>
      <p>Hola {p.name}. Te escribió {config.senderName} para invitarte a recibir pedidos de {p.trade.toLowerCase()} de tu zona.</p>
      <div className="card stack">
        <p><strong>Cómo funciona</strong></p>
        <ol>
          <li>Un vecino cuenta qué necesita, con fotos, dirección aproximada y urgencia.</li>
          <li>Te llega el pedido por WhatsApp y decidís si cotizás.</li>
          <li>Si cotizás, el vecino compara y te contacta directo.</li>
        </ol>
        <p><strong>Los primeros meses es gratis.</strong> No hay que instalar nada.</p>
      </div>
      <form action={joinAction}>
        <input type="hidden" name="code" value={code} />
        <button className="btn primary big" type="submit">Me sumo</button>
      </form>
      <form action={declineAction}>
        <input type="hidden" name="code" value={code} />
        <button className="btn big" type="submit">No me interesa</button>
      </form>
      <p className="muted"><a href="/privacidad">Aviso de privacidad</a></p>
    </main>
  );
}
