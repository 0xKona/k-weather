import { describe, it, expect } from "vitest";
import { latLngToUnitVector, latLngToQuaternion } from "./coordinates";

// Apply quaternion to vector: v' = q * v * q^-1
function applyQ(vx: number, vy: number, vz: number, qx: number, qy: number, qz: number, qw: number) {
  const cx = qy * vz - qz * vy;
  const cy = qz * vx - qx * vz;
  const cz = qx * vy - qy * vx;
  return [
    vx + 2 * (qw * cx + qy * cz - qz * cy),
    vy + 2 * (qw * cy + qz * cx - qx * cz),
    vz + 2 * (qw * cz + qx * cy - qy * cx),
  ];
}

describe("latLngToUnitVector", () => {
  it("places lng=-90 (Americas default view) on +Z axis", () => {
    const [x, y, z] = latLngToUnitVector(0, -90);
    expect(x).toBeCloseTo(0, 5);
    expect(y).toBeCloseTo(0, 5);
    expect(z).toBeCloseTo(1, 5);
  });

  it("places equator/prime meridian on +X axis", () => {
    const [x, y, z] = latLngToUnitVector(0, 0);
    expect(x).toBeCloseTo(1, 5);
    expect(y).toBeCloseTo(0, 5);
    expect(z).toBeCloseTo(0, 5);
  });

  it("places north pole on +Y axis", () => {
    const [, y] = latLngToUnitVector(90, 0);
    expect(y).toBeCloseTo(1, 5);
  });

  it("places south pole on -Y axis", () => {
    const [, y] = latLngToUnitVector(-90, 0);
    expect(y).toBeCloseTo(-1, 5);
  });

  it("always returns a unit vector", () => {
    const [x, y, z] = latLngToUnitVector(51.5, -0.1257);
    expect(Math.sqrt(x * x + y * y + z * z)).toBeCloseTo(1, 5);
  });
});

describe("latLngToQuaternion", () => {
  // With -30° tilt, the target point sits above centre at (0, sin30, cos30)
  const TILT = -30 * (Math.PI / 180);
  const expectedY = -Math.sin(TILT); // sin(30°) ≈ 0.5
  const expectedZ = Math.cos(TILT);  // cos(30°) ≈ 0.866

  it("returns a unit quaternion for any location", () => {
    const [qx, qy, qz, qw] = latLngToQuaternion(51.5, -0.1257);
    expect(Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw)).toBeCloseTo(1, 5);
  });

  it("rotates London to the tilted position (30° above centre)", () => {
    const lat = 51.5, lng = -0.1257;
    const [px, py, pz] = latLngToUnitVector(lat, lng);
    const [qx, qy, qz, qw] = latLngToQuaternion(lat, lng);
    const [rx, ry, rz] = applyQ(px, py, pz, qx, qy, qz, qw);
    expect(rx).toBeCloseTo(0, 2);
    expect(ry).toBeCloseTo(expectedY, 2);
    expect(rz).toBeCloseTo(expectedZ, 2);
  });

  it("rotates Sydney to the tilted position", () => {
    const lat = -33.8, lng = 151.2;
    const [px, py, pz] = latLngToUnitVector(lat, lng);
    const [qx, qy, qz, qw] = latLngToQuaternion(lat, lng);
    const [rx, ry, rz] = applyQ(px, py, pz, qx, qy, qz, qw);
    expect(rx).toBeCloseTo(0, 2);
    expect(ry).toBeCloseTo(expectedY, 2);
    expect(rz).toBeCloseTo(expectedZ, 2);
  });

  it("rotates Tokyo to the tilted position", () => {
    const lat = 35.6, lng = 139.7;
    const [px, py, pz] = latLngToUnitVector(lat, lng);
    const [qx, qy, qz, qw] = latLngToQuaternion(lat, lng);
    const [rx, ry, rz] = applyQ(px, py, pz, qx, qy, qz, qw);
    expect(rx).toBeCloseTo(0, 2);
    expect(ry).toBeCloseTo(expectedY, 2);
    expect(rz).toBeCloseTo(expectedZ, 2);
  });

  it("north projects upward (+Y) in screen space after rotation", () => {
    const lat = 51.5, lng = -0.1257;
    const [qx, qy, qz, qw] = latLngToQuaternion(lat, lng);
    const [nx, ny] = applyQ(0, 1, 0, qx, qy, qz, qw);
    const projLen = Math.sqrt(nx * nx + ny * ny);
    expect(ny / projLen).toBeCloseTo(1, 2);
    expect(Math.abs(nx / projLen)).toBeLessThan(0.05);
  });

  it("handles the antipodal degenerate case without NaN", () => {
    const [qx, qy, qz, qw] = latLngToQuaternion(0, 90);
    expect([qx, qy, qz, qw].some(isNaN)).toBe(false);
    expect(Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw)).toBeCloseTo(1, 5);
  });
});
