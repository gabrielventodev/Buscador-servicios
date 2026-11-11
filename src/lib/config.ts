function num(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = raw ? Number(raw) : fallback;
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

// En Vercel, si no se define BASE_URL, se usa el dominio del despliegue.
function resolveBaseUrl(): string {
  // En una vista previa, el enlace tiene que apuntar a esa misma vista previa.
  const vercelHost =
    process.env.VERCEL_ENV === "production"
      ? (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL)
      : process.env.VERCEL_URL;
  const url = process.env.BASE_URL ?? (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}

export const config = {
  baseUrl: resolveBaseUrl(),
  dailyBatchSize: num("DAILY_BATCH_SIZE", 20),
  noResponseDays: num("NO_RESPONSE_DAYS", 7),
  defaultAreaCode: process.env.DEFAULT_AREA_CODE ?? "3489",
  senderName: process.env.SENDER_NAME ?? "Gabriel",
  cityName: process.env.CITY_NAME ?? "Campana",
};

// Versión del aviso de privacidad que acepta el prestador al registrarse.
export const CONSENT_VERSION = "2026-11-v1";
