"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface UseGlobeRotationReturn {
  groupRef: React.RefObject<THREE.Group | null>;
  rotateTo: (lat: number, lng: number) => void;
}

const DEG_TO_RAD = Math.PI / 180;

/**
 * CALIBRATION MODE — applies fixed rotation for visual testing.
 * Set window.__GLOBE_X and window.__GLOBE_Y (degrees) from browser console.
 */
export function useGlobeRotation(): UseGlobeRotationReturn {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;

    // Read calibration values from window (set via browser console)
    const w = globalThis as unknown as Record<string, number | undefined>;
    const xDeg = w.__GLOBE_X ?? 0;
    const yDeg = w.__GLOBE_Y ?? 0;

    groupRef.current.rotation.set(
      xDeg * DEG_TO_RAD,
      yDeg * DEG_TO_RAD,
      0,
      "YXZ"
    );
  });

  // rotateTo is a no-op during calibration
  const rotateTo = () => {};

  return { groupRef, rotateTo };
}
