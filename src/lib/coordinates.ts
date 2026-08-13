const DEG_TO_RAD = Math.PI / 180;

// Three.js SphereGeometry UV mapping:
// The texture wraps with U=0 at the -X/+Z seam, meaning the front face (+Z toward camera)
// shows the texture at U=0.5. For a standard equirectangular Earth map, this puts
// longitude -90° at the front. We offset by +90° so that our geographic longitude
// correctly maps to the sphere's actual geometry.
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

// Returns a quaternion [x, y, z, w] that rotates the globe so that the given
// lat/lng faces the camera (camera looks down -Z, so front of globe is +Z).
// Uses setFromUnitVectors approach: quaternion FROM pointVec TO (0, 0, 1).
export function latLngToQuaternion(lat: number, lng: number): [number, number, number, number] {
  const [px, py, pz] = latLngToUnitVector(lat, lng);

  // Target direction: face camera at +Z
  // Quaternion from vector A to vector B: q = (A × B, A · B + 1), normalized
  const cx = py * 1 - pz * 0; // cross with (0, 0, 1)
  const cy = pz * 0 - px * 1;
  const cz = px * 0 - py * 0;
  const dot = pz; // dot with (0, 0, 1)

  let qx = cx;
  let qy = cy;
  let qz = cz;
  let qw = dot + 1;

  // Degenerate case: point is exactly at (0, 0, -1)
  if (qw < 0.000001) {
    qx = 0;
    qy = 1;
    qz = 0;
    qw = 0;
  }

  // Normalize
  const len = Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw);
  qx /= len;
  qy /= len;
  qz /= len;
  qw /= len;

  return [qx, qy, qz, qw];
}
