import { describe, it, expect } from "vitest";
import { latLngToUnitVector, latLngToQuaternion } from "./coordinates";

describe("latLngToUnitVector", () => {
  // With the +90° offset, lng=0 maps to +X (not +Z), and lng=-90 maps to +Z (front face)

  it("places lng=-90 (Americas) on +Z axis (front face)", () => {
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

  it("places north pole on +Y axis regardless of longitude", () => {
    const [x, y, z] = latLngToUnitVector(90, 0);

    expect(x).toBeCloseTo(0, 5);
    expect(y).toBeCloseTo(1, 5);
    expect(z).toBeCloseTo(0, 5);
  });

  it("places south pole on -Y axis", () => {
    const [x, y, z] = latLngToUnitVector(-90, 0);

    expect(x).toBeCloseTo(0, 5);
    expect(y).toBeCloseTo(-1, 5);
    expect(z).toBeCloseTo(0, 5);
  });

  it("returns a unit vector for any lat/lng", () => {
    const [x, y, z] = latLngToUnitVector(51.5, -0.1257);
    const len = Math.sqrt(x * x + y * y + z * z);

    expect(len).toBeCloseTo(1, 5);
  });
});

describe("latLngToQuaternion", () => {
  it("returns identity for lng=-90 (already facing camera)", () => {
    const [qx, qy, qz, qw] = latLngToQuaternion(0, -90);

    expect(qx).toBeCloseTo(0, 3);
    expect(qy).toBeCloseTo(0, 3);
    expect(qz).toBeCloseTo(0, 3);
    expect(qw).toBeCloseTo(1, 3);
  });

  it("returns a valid unit quaternion for any location", () => {
    const [qx, qy, qz, qw] = latLngToQuaternion(51.5, -0.1257);
    const len = Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw);

    expect(len).toBeCloseTo(1, 5);
  });

  it("rotates London to face +Z (camera direction)", () => {
    const lat = 51.5, lng = -0.1257;
    const [px, py, pz] = latLngToUnitVector(lat, lng);
    const [qx, qy, qz, qw] = latLngToQuaternion(lat, lng);

    // Apply quaternion to vector: v' = v + 2*w*(q × v) + 2*(q × (q × v))
    const cx1 = qy * pz - qz * py;
    const cy1 = qz * px - qx * pz;
    const cz1 = qx * py - qy * px;

    const cx2 = qy * cz1 - qz * cy1;
    const cy2 = qz * cx1 - qx * cz1;
    const cz2 = qx * cy1 - qy * cx1;

    const rx = px + 2 * (qw * cx1 + cx2);
    const ry = py + 2 * (qw * cy1 + cy2);
    const rz = pz + 2 * (qw * cz1 + cz2);

    expect(rx).toBeCloseTo(0, 3);
    expect(ry).toBeCloseTo(0, 3);
    expect(rz).toBeCloseTo(1, 3);
  });

  it("rotates Sydney to face +Z", () => {
    const lat = -33.8, lng = 151.2;
    const [px, py, pz] = latLngToUnitVector(lat, lng);
    const [qx, qy, qz, qw] = latLngToQuaternion(lat, lng);

    const cx1 = qy * pz - qz * py;
    const cy1 = qz * px - qx * pz;
    const cz1 = qx * py - qy * px;

    const cx2 = qy * cz1 - qz * cy1;
    const cy2 = qz * cx1 - qx * cz1;
    const cz2 = qx * cy1 - qy * cx1;

    const rx = px + 2 * (qw * cx1 + cx2);
    const ry = py + 2 * (qw * cy1 + cy2);
    const rz = pz + 2 * (qw * cz1 + cz2);

    expect(rx).toBeCloseTo(0, 3);
    expect(ry).toBeCloseTo(0, 3);
    expect(rz).toBeCloseTo(1, 3);
  });

  it("rotates Tokyo to face +Z", () => {
    const lat = 35.6, lng = 139.7;
    const [px, py, pz] = latLngToUnitVector(lat, lng);
    const [qx, qy, qz, qw] = latLngToQuaternion(lat, lng);

    const cx1 = qy * pz - qz * py;
    const cy1 = qz * px - qx * pz;
    const cz1 = qx * py - qy * px;

    const cx2 = qy * cz1 - qz * cy1;
    const cy2 = qz * cx1 - qx * cz1;
    const cz2 = qx * cy1 - qy * cx1;

    const rx = px + 2 * (qw * cx1 + cx2);
    const ry = py + 2 * (qw * cy1 + cy2);
    const rz = pz + 2 * (qw * cz1 + cz2);

    expect(rx).toBeCloseTo(0, 3);
    expect(ry).toBeCloseTo(0, 3);
    expect(rz).toBeCloseTo(1, 3);
  });

  it("handles antipodal point (0, 90) — opposite of default front", () => {
    const [qx, qy, qz, qw] = latLngToQuaternion(0, 90);
    const len = Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw);

    expect(len).toBeCloseTo(1, 5);
  });
});
