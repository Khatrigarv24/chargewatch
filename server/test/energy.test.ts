import { describe, expect, it } from "vitest";
import { computeSessionEnergyKwh } from "../src/lib/energy.js";

describe("computeSessionEnergyKwh", () => {
  it("multiplies power by duration in hours", () => {
    const started = new Date("2026-01-01T00:00:00Z");
    const ended = new Date("2026-01-01T01:30:00Z");
    expect(computeSessionEnergyKwh(started, ended, 50)).toBeCloseTo(75, 5);
  });

  it("returns 0 for a zero-length session", () => {
    const t = new Date("2026-01-01T00:00:00Z");
    expect(computeSessionEnergyKwh(t, t, 100)).toBe(0);
  });
});
