const DEG_TO_RAD = Math.PI / 180;

// Three.js SphereGeometry UV mapping: the front face (+Z toward camera) corresponds
// to longitude -90° on the texture. We offset by +90° to align geographic coordinates
// with the sphere's actual geometry.
const LNG_OFFSET = 90;

// Convert lat/lng to the position of that point on a unit sphere (Y-up).
export function latLngToUnitVector(lat: number, lng: number): [number, number, number] {
  const phi = lat * DEG_TO_RAD;
  const theta = (lng + LNG_OFFSET) * DEG_TO_RAD;

  const x = Math.cos(phi) * Math.sin(theta);
  const y = Math.sin(phi);
  const z = Math.cos(phi) * Math.cos(theta);

  return [x, y, z];
}

// Multiply two quaternions: r = a * b
function multiplyQuaternions(
  ax: number, ay: number, az: number, aw: number,
  bx: number, by: number, bz: number, bw: number
): [number, number, number, number] {
  return [
    ax * bw + aw * bx + ay * bz - az * by,
    ay * bw + aw * by + az * bx - ax * bz,
    az * bw + aw * bz + ax * by - ay * bx,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

// Apply a quaternion to a vector: v' = q * v * q^-1
function applyQuaternion(
  vx: number, vy: number, vz: number,
  qx: number, qy: number, qz: number, qw: number
): [number, number, number] {
  const cx = qy * vz - qz * vy;
  const cy = qz * vx - qx * vz;
  const cz = qx * vy - qy * vx;

  return [
    vx + 2 * (qw * cx + qy * cz - qz * cy),
    vy + 2 * (qw * cy + qz * cx - qx * cz),
    vz + 2 * (qw * cz + qx * cy - qy * cx),
  ];
}

// Quaternion from unit vector A to unit vector B
function quaternionFromVectors(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number
): [number, number, number, number] {
  const dot = ax * bx + ay * by + az * bz;
  let qx = ay * bz - az * by;
  let qy = az * bx - ax * bz;
  let qz = ax * by - ay * bx;
  let qw = dot + 1;

  // Degenerate: vectors are exactly opposite
  if (qw < 0.000001) {
    // Rotate 180° around a perpendicular axis
    if (Math.abs(ax) < 0.9) { qx = 0; qy = az; qz = -ay; qw = 0; }
    else                      { qx = -az; qy = 0; qz = ax; qw = 0; }
  }

  const len = Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw);
  return [qx / len, qy / len, qz / len, qw / len];
}

// Returns a quaternion that rotates the globe so that:
//   1. The given lat/lng faces the camera (+Z)
//   2. North is always up (+Y) — consistent orientation across all locations
export function latLngToQuaternion(lat: number, lng: number): [number, number, number, number] {
  const [px, py, pz] = latLngToUnitVector(lat, lng);

  // Step 1: rotate the target point to face +Z
  let [qx, qy, qz, qw] = quaternionFromVectors(px, py, pz, 0, 0, 1);

  // Step 2: after step 1, the globe's geographic north (0,1,0 in globe space)
  // has been rotated to some direction. Find where it ended up:
  const [nx, ny] = applyQuaternion(0, 1, 0, qx, qy, qz, qw);

  // Project that vector onto the plane perpendicular to +Z (the camera plane)
  // and find the angle between it and +Y (screen up)
  const projLen = Math.sqrt(nx * nx + ny * ny);

  if (projLen > 0.001) {
    // Step 3: compute the Z-axis correction to align the projected north with +Y
    const [rqx, rqy, rqz, rqw] = quaternionFromVectors(
      nx / projLen, ny / projLen, 0,
      0, 1, 0
    );

    // Apply the correction rotation after the first rotation (in camera space = pre-multiply)
    [qx, qy, qz, qw] = multiplyQuaternions(rqx, rqy, rqz, rqw, qx, qy, qz, qw);
  }

  return [qx, qy, qz, qw];
}
