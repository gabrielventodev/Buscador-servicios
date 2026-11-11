import { describe, expect, it } from "vitest";
import { generateCode, isValidCode } from "./code";

describe("generateCode", () => {
  it("genera códigos válidos y distintos", () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateCode()));
    expect(codes.size).toBe(500);
    for (const c of codes) expect(isValidCode(c)).toBe(true);
  });
  it("rechaza códigos con formato inválido", () => {
    expect(isValidCode("../admin")).toBe(false);
    expect(isValidCode("ABCDEFGH")).toBe(false);
  });
});
