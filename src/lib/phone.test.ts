import { describe, expect, it } from "vitest";
import { normalizeArPhone } from "./phone";

describe("normalizeArPhone", () => {
  const cases: [string, string | null][] = [
    ["3489 15 123456", "5493489123456"],
    ["(03489) 15-123456", "5493489123456"],
    ["15 123456", "5493489123456"],
    ["123456", "5493489123456"],
    ["3489123456", "5493489123456"],
    ["+54 9 3489 123456", "5493489123456"],
    ["+54 3489 123456", "5493489123456"],
    ["0054 9 11 2345 6789", "5491123456789"],
    ["11 2345 6789", "5491123456789"],
    ["12345", null],
    ["", null],
    ["abc", null],
  ];
  it.each(cases)("%s -> %s", (input, expected) => {
    expect(normalizeArPhone(input, "3489")).toBe(expected);
  });
});
