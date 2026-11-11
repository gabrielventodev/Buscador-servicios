export const STATUSES = ["pendiente", "enviado", "interesado", "registrado", "baja"] as const;
export type Status = (typeof STATUSES)[number];
export type OptOutReason = "no_me_interesa" | "manual" | "sin_respuesta";

// Transiciones permitidas. "registrado" es final. A quien está en "baja" no se
// le vuelve a escribir (la tanda solo toma "pendiente"), pero si el propio
// prestador vuelve al enlace y toca "Me sumo", puede pasar a "interesado".
const ALLOWED: Record<Status, readonly Status[]> = {
  pendiente: ["enviado", "interesado", "baja"],
  enviado: ["interesado", "baja"],
  interesado: ["registrado", "baja"],
  registrado: [],
  baja: ["interesado"],
};

export function canTransition(from: Status, to: Status): boolean {
  return ALLOWED[from].includes(to);
}

/** Estados desde los que se puede pasar a `to` (para usar en el WHERE). */
export function sourcesFor(to: Status): Status[] {
  return STATUSES.filter((s) => canTransition(s, to));
}

export const STATUS_LABEL: Record<Status, string> = {
  pendiente: "Pendiente",
  enviado: "Enviado",
  interesado: "Interesado",
  registrado: "Registrado",
  baja: "Baja",
};

export const REASON_LABEL: Record<OptOutReason, string> = {
  no_me_interesa: "No le interesa",
  manual: "Marcado a mano",
  sin_respuesta: "Sin respuesta",
};
