function num(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = raw ? Number(raw) : fallback;
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const config = {
  baseUrl: (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  dailyBatchSize: num("DAILY_BATCH_SIZE", 20),
  noResponseDays: num("NO_RESPONSE_DAYS", 7),
  defaultAreaCode: process.env.DEFAULT_AREA_CODE ?? "3489",
  senderName: process.env.SENDER_NAME ?? "Gabriel",
  cityName: process.env.CITY_NAME ?? "Campana",
};

// Versión del aviso de privacidad que acepta el prestador al registrarse.
export const CONSENT_VERSION = "2026-11-v1";
