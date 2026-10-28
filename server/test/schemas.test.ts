import { describe, expect, it } from "vitest";
import { energyQuerySchema, siteIdParamSchema } from "../src/schemas.js";

describe("siteIdParamSchema", () => {
  it("coerces a numeric string id", () => {
    expect(siteIdParamSchema.parse({ id: "5" })).toEqual({ id: 5 });
  });

  it("rejects a non-numeric id", () => {
    expect(() => siteIdParamSchema.parse({ id: "abc" })).toThrow();
  });
});

describe("energyQuerySchema", () => {
  it("accepts a valid from/to range", () => {
    expect(
      energyQuerySchema.parse({ from: "2026-01-01", to: "2026-01-02" }),
    ).toEqual({ from: "2026-01-01", to: "2026-01-02" });
  });

  it("rejects from after to", () => {
    expect(() =>
      energyQuerySchema.parse({ from: "2026-01-05", to: "2026-01-01" }),
    ).toThrow();
  });

  it("rejects a malformed date", () => {
    expect(() =>
      energyQuerySchema.parse({ from: "01/01/2026", to: "2026-01-02" }),
    ).toThrow();
  });
});
