import { describe, expect, it } from "vitest";
import { contrastRatio, hexToRgb, mixHex, rgbToHex } from "./color";
import { KEYFRAMES, formatClock, formatKelvin, sampleDay, sunPosition, wrapHour } from "./daylight";
import { normalisedSpectrum, spectrumPath } from "./spectrum";
import { BASE_PRICE, DEFAULT_CONFIGURATION, priceOf } from "./catalog";
import { editionNumber, hasErrors, validateReservation } from "./reserve";

describe("color", () => {
  it("round-trips hex through rgb", () => {
    expect(rgbToHex(hexToRgb("#c9a46a"))).toBe("#c9a46a");
  });

  it("returns the endpoints of a mix at t = 0 and t = 1", () => {
    expect(mixHex("#000000", "#ffffff", 0)).toBe("#000000");
    expect(mixHex("#000000", "#ffffff", 1)).toBe("#ffffff");
  });

  it("rejects malformed hex", () => {
    expect(() => hexToRgb("blue")).toThrow(/Invalid hex/);
  });

  it("measures WCAG contrast", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
});

describe("daylight", () => {
  it("keyframes are sorted and span a full day", () => {
    const hours = KEYFRAMES.map((k) => k.hour);
    expect(hours).toEqual([...hours].sort((a, b) => a - b));
    expect(hours[0]).toBe(0);
    expect(hours.at(-1)).toBe(24);
  });

  it("is warm and dim at night, cool and bright at noon", () => {
    const night = sampleDay(2);
    const noon = sampleDay(12.5);
    expect(night.kelvin).toBeLessThan(2000);
    expect(noon.kelvin).toBeCloseTo(6500, 0);
    expect(noon.lux).toBeGreaterThan(night.lux * 100);
    expect(noon.isBright).toBe(true);
    expect(night.isBright).toBe(false);
  });

  it("wraps hours outside 0..24", () => {
    expect(wrapHour(25)).toBe(1);
    expect(wrapHour(-1)).toBe(23);
    expect(sampleDay(26).hour).toBe(2);
  });

  it("formats clock and kelvin like a spec sheet", () => {
    expect(formatClock(6.7)).toBe("06:42");
    expect(formatClock(23.999)).toBe("23:59");
    expect(formatKelvin(2412)).toBe("2,400 K");
  });

  it("puts the sun at its highest mid-day and below the horizon at night", () => {
    expect(sunPosition(2)).toBeNull();
    const midday = sunPosition((6.6 + 19.1) / 2);
    expect(midday?.y).toBeCloseTo(1, 5);
  });
});

describe("spectrum", () => {
  it("peaks at 1 and shifts toward blue as temperature rises", () => {
    const warm = normalisedSpectrum(2000);
    const cool = normalisedSpectrum(6500);
    expect(Math.max(...warm)).toBe(1);
    expect(cool[0]).toBeGreaterThan(warm[0]);
  });

  it("builds a closed SVG path", () => {
    expect(spectrumPath(3000, 100, 50)).toMatch(/^M0,50 L.* Z$/);
  });
});

describe("catalog", () => {
  it("prices the default configuration at the base price", () => {
    expect(priceOf(DEFAULT_CONFIGURATION)).toBe(BASE_PRICE);
  });

  it("adds option surcharges", () => {
    expect(priceOf({ finish: "bronze", base: "marble", size: "grand" })).toBe(BASE_PRICE + 240 + 320 + 900);
  });
});

describe("reserve", () => {
  it("accepts a complete reservation", () => {
    expect(hasErrors(validateReservation({ name: "Ada", email: "ada@example.com", country: "Denmark" }))).toBe(false);
  });

  it("flags every missing field", () => {
    const errors = validateReservation({ name: " ", email: "nope", country: "" });
    expect(Object.keys(errors).sort()).toEqual(["country", "email", "name"]);
  });

  it("gives the same edition number for the same email regardless of case", () => {
    expect(editionNumber("Ada@Example.com")).toBe(editionNumber("ada@example.com"));
    expect(editionNumber("ada@example.com")).toMatch(/^\d{3}$/);
  });
});
