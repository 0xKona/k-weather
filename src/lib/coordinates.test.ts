import { describe, it, expect } from "vitest";
import {
  latLngToSpherical,
  calculateSunDirection,
  getTimezoneOffset,
} from "./coordinates";

describe("latLngToSpherical", () => {
  it("converts equator/prime meridian to correct spherical coords", () => {
    const result = latLngToSpherical(0, 0);

    // At lat=0, lng=0: phi = PI/2 (equator), theta = 0
    expect(result.phi).toBeCloseTo(Math.PI / 2, 5);
    expect(result.theta).toBeCloseTo(0, 5);
  });

  it("converts north pole to phi=0", () => {
    const result = latLngToSpherical(90, 0);

    // North pole: phi = 0
    expect(result.phi).toBeCloseTo(0, 5);
  });

  it("converts south pole to phi=PI", () => {
    const result = latLngToSpherical(-90, 0);

    // South pole: phi = PI
    expect(result.phi).toBeCloseTo(Math.PI, 5);
  });

  it("converts longitude 90E to theta=PI/2", () => {
    const result = latLngToSpherical(0, 90);

    expect(result.theta).toBeCloseTo(Math.PI / 2, 5);
  });

  it("converts longitude 180 to theta=PI", () => {
    const result = latLngToSpherical(0, 180);

    expect(result.theta).toBeCloseTo(Math.PI, 5);
  });

  it("converts negative longitude correctly", () => {
    const result = latLngToSpherical(0, -90);

    expect(result.theta).toBeCloseTo(-Math.PI / 2, 5);
  });

  it("converts London coordinates", () => {
    const result = latLngToSpherical(51.5, -0.1257);

    // lat 51.5 → phi = PI/2 - 51.5*(PI/180)
    const expectedPhi = Math.PI / 2 - (51.5 * Math.PI) / 180;
    const expectedTheta = (-0.1257 * Math.PI) / 180;

    expect(result.phi).toBeCloseTo(expectedPhi, 5);
    expect(result.theta).toBeCloseTo(expectedTheta, 5);
  });
});

describe("calculateSunDirection", () => {
  it("returns a normalised 3D vector", () => {
    const date = new Date("2026-06-21T12:00:00Z");
    const sun = calculateSunDirection(date);

    // Should be unit length
    const length = Math.sqrt(sun.x ** 2 + sun.y ** 2 + sun.z ** 2);
    expect(length).toBeCloseTo(1, 4);
  });

  it("sun is in positive x direction at noon UTC on equinox", () => {
    // March equinox, noon UTC — sun should be roughly at lng=0 (positive x)
    const date = new Date("2026-03-20T12:00:00Z");
    const sun = calculateSunDirection(date);

    expect(sun.x).toBeGreaterThan(0.8);
  });

  it("sun is in negative x direction at midnight UTC on equinox", () => {
    // Midnight UTC — sun should be on the opposite side
    const date = new Date("2026-03-20T00:00:00Z");
    const sun = calculateSunDirection(date);

    expect(sun.x).toBeLessThan(-0.8);
  });

  it("sun direction changes with time of day", () => {
    const morning = calculateSunDirection(new Date("2026-06-21T06:00:00Z"));
    const noon = calculateSunDirection(new Date("2026-06-21T12:00:00Z"));

    // Different times should produce different directions
    expect(morning.x).not.toBeCloseTo(noon.x, 1);
  });
});

describe("getTimezoneOffset", () => {
  it("returns 0 for UTC", () => {
    expect(getTimezoneOffset("UTC")).toBe(0);
  });

  it("returns a number for valid timezone strings", () => {
    const offset = getTimezoneOffset("Europe/London");
    expect(typeof offset).toBe("number")
  });

  it("returns offset for timezone ahead of UTC", () => {
    // Tokyo is UTC+9
    const offset = getTimezoneOffset("Asia/Tokyo");
    expect(offset).toBe(9);
  });

  it("returns 0 for invalid timezone strings", () => {
    const offset = getTimezoneOffset("Invalid/Timezone");
    expect(offset).toBe(0);
  });
});
