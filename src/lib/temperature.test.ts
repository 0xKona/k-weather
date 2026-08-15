import { describe, it, expect } from "vitest";
import {
  celsiusToFahrenheit,
  formatTemperature,
  otherUnit,
} from "./temperature";

describe("celsiusToFahrenheit", () => {
  it("converts the freezing point", () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
  });

  it("converts the boiling point", () => {
    expect(celsiusToFahrenheit(100)).toBe(212);
  });

  it("converts -40 (where the scales meet)", () => {
    expect(celsiusToFahrenheit(-40)).toBe(-40);
  });

  it("converts decimal values", () => {
    expect(celsiusToFahrenheit(18.5)).toBeCloseTo(65.3);
  });
});

describe("formatTemperature", () => {
  it("shows celsius values as-is with the unit letter", () => {
    expect(formatTemperature(18.5, "celsius")).toBe("18.5°C");
    expect(formatTemperature(22, "celsius")).toBe("22°C");
  });

  it("shows fahrenheit rounded to a whole degree with the unit letter", () => {
    expect(formatTemperature(18.5, "fahrenheit")).toBe("65°F");
    expect(formatTemperature(22, "fahrenheit")).toBe("72°F");
  });

  it("handles negative temperatures in fahrenheit", () => {
    expect(formatTemperature(-40, "fahrenheit")).toBe("-40°F");
  });
});

describe("otherUnit", () => {
  it("returns the opposite unit", () => {
    expect(otherUnit("celsius")).toBe("fahrenheit");
    expect(otherUnit("fahrenheit")).toBe("celsius");
  });
});
