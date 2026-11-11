import { describe, expect, it } from "vitest";
import { buildInvitation, pickVariant, whatsappLink } from "./message";

const base = { name: "Juan", trade: "Plomero", link: "https://x.test/p/abc", senderName: "Gabriel", cityName: "Campana" };

describe("buildInvitation", () => {
  it.each(["A", "B"] as const)("variante %s dice quién escribe, trae el enlace y ofrece la baja", (variant) => {
    const text = buildInvitation({ ...base, variant });
    expect(text).toContain("soy Gabriel, de Campana");
    expect(text).toContain("https://x.test/p/abc");
    expect(text).toContain("No me interesa");
    expect(text).toContain("trabajás como plomero");
  });

  it("las variantes destacan beneficios distintos", () => {
    expect(buildInvitation({ ...base, variant: "A" })).toContain("fotos");
    expect(buildInvitation({ ...base, variant: "B" })).toContain("no pagás nada");
  });
});

it("no arma plurales de oficios compuestos", () => {
  const text = buildInvitation({ ...base, trade: "Albañil", variant: "A" });
  expect(text).toContain("trabajás como albañil.");
  expect(text).not.toContain("albañils");
});

describe("whatsappLink", () => {
  it("codifica el texto", () => {
    expect(whatsappLink("5493489123456", "hola & chau")).toBe("https://wa.me/5493489123456?text=hola%20%26%20chau");
  });
});

describe("pickVariant", () => {
  it("alterna A y B", () => {
    expect([0, 1, 2, 3].map(pickVariant)).toEqual(["A", "B", "A", "B"]);
  });
});
