"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { calculateSunDirection } from "@/lib/coordinates";

const UPDATE_INTERVAL_MS = 60_000;

// Provides a reactive sun direction vector updated every minute for day/night shading
export function useDayNightCycle(): React.RefObject<THREE.Vector3> {
  const sunDirection = useRef(new THREE.Vector3());

  // Set initial sun position
  useEffect(() => {
    const update = () => {
      const dir = calculateSunDirection(new Date());
      sunDirection.current.set(dir.x, dir.y, dir.z).normalize();
    };

    update();
    const interval = setInterval(update, UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return sunDirection;
}
