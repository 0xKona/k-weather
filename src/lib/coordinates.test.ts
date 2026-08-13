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
  it("returns a unit quaternion for any location", () => {
    const [qx, qy, qz, qw] = latLngToQuaternion(51.5, -0.1257);
    expect(Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw)).toBeCloseTo(1, 5);
  });

  it("rotates the target point to face +Z (camera direction)", () => {
    const lat = 51.5, lng = -0.1257; // London
    const [px, py, pz] = latLngToUnitVector(lat, lng);
    const [qx, qy, qz, qw] = latLngToQuaternion(lat, lng);
    const [rx, ry, rz] = applyQ(px, py, pz, qx, qy, qz, qw);
    expect(rx).toBeCloseTo(0, 3);
    expect(ry).toBeCloseTo(0, 3);
    expect(rz).toBeCloseTo(1, 3);
  });

  it("rotates Sydney's point to face +Z", () => {
    const lat = -33.8, lng = 151.2;
    const [px, py, pz] = latLngToUnitVector(lat, lng);
    const [qx, qy, qz, qw] = latLngToQuaternion(lat, lng);
    const [rx, ry, rz] = applyQ(px, py, pz, qx, qy, qz, qw);
    expect(rx).toBeCloseTo(0, 3);
    expect(ry).toBeCloseTo(0, 3);
    expect(rz).toBeCloseTo(1, 3);
  });

  it("rotates Tokyo's point to face +Z", () => {
    const lat = 35.6, lng = 139.7;
    const [px, py, pz] = latLngToUnitVector(lat, lng);
    const [qx, qy, qz, qw] = latLngToQuaternion(lat, lng);
    const [rx, ry, rz] = applyQ(px, py, pz, qx, qy, qz, qw);
    expect(rx).toBeCloseTo(0, 3);
    expect(ry).toBeCloseTo(0, 3);
    expect(rz).toBeCloseTo(1, 3);
  });

  it("north pole projects upward (+Y) in screen space after rotation", () => {
    const lat = 51.5, lng = -0.1257; // London
    const [qx, qy, qz, qw] = latLngToQuaternion(lat, lng);
    // Rotate geographic north vector (0,1,0 in globe space)
    const [nx, ny] = applyQ(0, 1, 0, qx, qy, qz, qw);
    // Project onto camera plane (XY) — the Y component should dominate (north is up)
    const projLen = Math.sqrt(nx * nx + ny * ny);
    expect(ny / projLen).toBeCloseTo(1, 2);
    // X component of projection should be near zero (not leaning left/right)
    expect(Math.abs(nx / projLen)).toBeLessThan(0.05);
  });

  it("handles the antipodal degenerate case without NaN", () => {
    const [qx, qy, qz, qw] = latLngToQuaternion(0, 90);
    expect([qx, qy, qz, qw].some(isNaN)).toBe(false);
    expect(Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw)).toBeCloseTo(1, 5);
  });
});
