"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { latLngToUnitVector } from "@/lib/coordinates";

interface CountryOutlineProps {
  countryCode: string | null;
  radius: number;
  geoJson: GeoJSON.FeatureCollection | null;
}

// How many vertices to reveal per second — controls draw speed
const DRAW_SPEED = 4000;

// Convert a GeoJSON ring (array of [lng, lat] pairs) into a Float32Array of 3D positions on the sphere
function ringToPositions(ring: number[][], radius: number): Float32Array {
  // Close the loop by repeating the first point at the end
  const points = [...ring, ring[0]];
  const positions = new Float32Array(points.length * 3);
  points.forEach(([lng, lat], i) => {
    const [x, y, z] = latLngToUnitVector(lat, lng);
    positions[i * 3]     = x * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = z * radius;
  });
  return positions;
}

// Extract all polygon rings from a GeoJSON feature (handles Polygon and MultiPolygon)
function extractRings(feature: GeoJSON.Feature): number[][][] {
  const geo = feature.geometry;
  if (geo.type === "Polygon") return geo.coordinates as number[][][];
  if (geo.type === "MultiPolygon") return (geo.coordinates as number[][][][]).flat();
  return [];
}

// A single animated line ring
function OutlineRing({
  positions,
  animationOffset,
  totalVertices,
  animProgress,
}: {
  positions: Float32Array;
  animationOffset: number;
  totalVertices: number;
  animProgress: React.MutableRefObject<number>;
}) {
  const geoRef = useRef<THREE.BufferGeometry>(null);
  const vertexCount = positions.length / 3;

  useFrame(() => {
    if (!geoRef.current) return;
    // Global progress in vertices, minus this ring's start offset
    const localProgress = animProgress.current - animationOffset;
    const visible = Math.max(0, Math.min(vertexCount, Math.floor(localProgress)));
    geoRef.current.setDrawRange(0, visible);
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, 0);
    return geo;
  }, [positions]);

  return (
    <line>
      <primitive object={geometry} ref={geoRef} attach="geometry" />
      <lineBasicMaterial color={0x88ccff} transparent opacity={0.85} depthWrite={false} />
    </line>
  );
}

export function CountryOutline({ countryCode, radius, geoJson }: CountryOutlineProps) {
  const animProgress = useRef(0);
  const prevCode = useRef<string | null>(null);

  // Reset animation whenever the country changes
  useEffect(() => {
    if (countryCode !== prevCode.current) {
      animProgress.current = 0;
      prevCode.current = countryCode;
    }
  }, [countryCode]);

  // Advance the global animation progress each frame
  useFrame((_, delta) => {
    animProgress.current += delta * DRAW_SPEED;
  });

  // Build ring data for the selected country
  const rings = useMemo(() => {
    if (!countryCode || !geoJson) return [];

    const feature = geoJson.features.find(
      (f) => f.properties?.ISO_A2 === countryCode
    );
    if (!feature) return [];

    const rawRings = extractRings(feature);

    // Build positions and track cumulative vertex offsets for staggered draw
    let offset = 0;
    return rawRings.map((ring) => {
      const positions = ringToPositions(ring, radius + 0.05);
      const result = { positions, offset };
      offset += positions.length / 3;
      return result;
    });
  }, [countryCode, geoJson, radius]);

  if (!rings.length) return null;

  return (
    <group>
      {rings.map(({ positions, offset }, i) => (
        <OutlineRing
          key={`${countryCode}-${i}`}
          positions={positions}
          animationOffset={offset}
          totalVertices={positions.length / 3}
          animProgress={animProgress}
        />
      ))}
    </group>
  );
}
