export type Variant = "A" | "B";

export interface MessageInput {
  name: string;
  trade: string;
  link: string;
  variant: Variant;
  senderName: string;
  cityName: string;
}

/**
 * Mensaje de invitación. Dos variantes para comparar qué beneficio convence más:
 * A = pedidos con fotos y datos completos; B = gratis los primeros meses.
 * Siempre dice quién escribe, de dónde, y ofrece la baja en el mismo enlace.
 */
export function buildInvitation(m: MessageInput): string {
  // Sin plurales armados a mano: "albañils" o "técnico de aires" quedan mal.
  const trade = m.trade.toLowerCase();
  const benefit =
    m.variant === "A"
      ? "que te pasa pedidos de vecinos de la zona con fotos, dirección y urgencia ya cargadas, para que cotices sin ir a ciegas. Los primeros meses es gratis para vos."
      : "que te pasa pedidos de trabajo de vecinos de la zona. Los primeros meses es totalmente gratis para vos: recibís pedidos y no pagás nada.";
  return (
    `Hola ${m.name}, soy ${m.senderName}, de ${m.cityName}. Vi que trabajás como ${trade}. Estoy armando una app ${benefit} ` +
    `Si te interesa, mirá cómo funciona y sumate acá: ${m.link} ` +
    `Si no, tocá "No me interesa" en el mismo enlace y no te escribo más.`
  );
}

export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function pickVariant(sequence: number): Variant {
  return sequence % 2 === 0 ? "A" : "B";
}
