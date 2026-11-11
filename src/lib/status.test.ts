import { describe, expect, it } from "vitest";
import { canTransition, sourcesFor } from "./status";

describe("transiciones", () => {
  it("registrado es final", () => {
    expect(canTransition("registrado", "baja")).toBe(false);
    expect(canTransition("registrado", "enviado")).toBe(false);
  });
  it("a quien está de baja no se le vuelve a enviar", () => {
    expect(canTransition("baja", "enviado")).toBe(false);
  });
  it("el propio prestador puede sumarse después de una baja", () => {
    expect(canTransition("baja", "interesado")).toBe(true);
  });
  it("solo se registra quien tocó Me sumo", () => {
    expect(sourcesFor("registrado")).toEqual(["interesado"]);
  });
  it("solo se envía a pendientes", () => {
    expect(sourcesFor("enviado")).toEqual(["pendiente"]);
  });
});
