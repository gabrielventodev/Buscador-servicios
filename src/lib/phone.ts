/**
 * Normaliza un celular argentino al formato que espera wa.me:
 * 54 + 9 + código de área (sin 0) + número (sin 15). Ej.: 5493489123456.
 * Devuelve null si no puede interpretarlo.
 */
export function normalizeArPhone(input: string, defaultAreaCode: string): string | null {
  let d = input.replace(/\D/g, "");
  if (!d) return null;

  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("54")) {
    d = d.slice(2);
    if (d.startsWith("9")) d = d.slice(1);
  }
  if (d.startsWith("0")) d = d.slice(1);

  const area = defaultAreaCode.replace(/\D/g, "");
  const localLength = 10 - area.length;

  // "15 123456" o "123456": número local sin código de área.
  if (d.startsWith("15") && d.length === localLength + 2) d = area + d.slice(2);
  else if (d.length === localLength) d = area + d;

  // Código de área + 15 + número, con cualquier código de área:
  // "3489 15 123456", "011 15 2430 9410", "221 15 123 4567".
  if (d.length === 12) {
    if (d.startsWith(area + "15")) d = area + d.slice(area.length + 2);
    else if (d.startsWith("1115")) d = "11" + d.slice(4);
    else {
      for (const len of [3, 4]) {
        if (d.slice(len, len + 2) === "15") {
          d = d.slice(0, len) + d.slice(len + 2);
          break;
        }
      }
    }
  }

  if (d.length !== 10) return null;
  return "549" + d;
}

export function formatPhone(normalized: string): string {
  return "+" + normalized;
}
