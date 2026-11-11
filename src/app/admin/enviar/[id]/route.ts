import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { buildInvitation, whatsappLink } from "@/lib/message";
import { getById, markSent } from "@/lib/prospects";

export const dynamic = "force-dynamic";

// Lo abre el botón "Enviar por WhatsApp" del panel: marca Enviado y redirige a
// WhatsApp con el mensaje listo. El envío real lo confirma Gabriel en WhatsApp.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.redirect(new URL("/admin", req.url));

  const p = (await markSent(id)) ?? (await getById(id));
  if (!p || (p.status !== "enviado" && p.status !== "pendiente")) {
    const err = encodeURIComponent("Ese prestador ya no está en la tanda (se registró o está de baja).");
    return NextResponse.redirect(new URL(`/admin?err=${err}`, req.url));
  }

  const text = buildInvitation({
    name: p.name,
    trade: p.trade,
    link: `${config.baseUrl}/p/${p.code}`,
    variant: p.variant,
    senderName: config.senderName,
    cityName: config.cityName,
  });
  return NextResponse.redirect(whatsappLink(p.phone, text));
}
