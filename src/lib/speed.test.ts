import { describe, it, expect } from "vitest";
import {
  kphToMph,
  formatWindSpeed,
  otherSpeedUnit,
  speedUnitLabel,
} from "./speed";

describe("kphToMph", () => {
  it("converts zero", () => {
    expect(kphToMph(0)).toBe(0);
  });

  it("converts a round value", () => {
    expect(kphToMph(100)).toBeCloseTo(62.1371, 4);
  });

  it("converts the exact mile definition", () => {
    expect(kphToMph(1.609344)).toBeCloseTo(1);
  });

  it("converts decimal values", () => {
    expect(kphToMph(12.3)).toBeCloseTo(7.6429, 4);
  });
});

describe("formatWindSpeed", () => {
  it("shows km/h values as-is with the unit label", () => {
    expect(formatWindSpeed(12.3, "kph")).toBe("12.3 km/h");
    expect(formatWindSpeed(22, "kph")).toBe("22 km/h");
  });

  it("shows mph rounded to a whole number with the unit label", () => {
    expect(formatWindSpeed(12.3, "mph")).toBe("8 mph");
    expect(formatWindSpeed(100, "mph")).toBe("62 mph");
    expect(formatWindSpeed(0, "mph")).toBe("0 mph");
  });
});

describe("otherSpeedUnit", () => {
  it("returns the opposite unit", () => {
    expect(otherSpeedUnit("kph")).toBe("mph");
    expect(otherSpeedUnit("mph")).toBe("kph");
  });
});

describe("speedUnitLabel", () => {
  it("returns the human-readable unit name", () => {
    expect(speedUnitLabel("kph")).toBe("Kilometers per hour");
    expect(speedUnitLabel("mph")).toBe("Miles per hour");
  });
});
