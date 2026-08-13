"use client";

import { useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface UseGlobeRotationOptions {
  idleSpeed?: number;
  animationDuration?: number;
}

interface UseGlobeRotationReturn {
  groupRef: React.RefObject<THREE.Group | null>;
  rotateTo: (lat: number, lng: number) => void;
}

const DEG_TO_RAD = Math.PI / 180;

// Normalize angle to [-PI, PI] range for shortest-path interpolation
function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

// Manages globe rotation using Euler angles for map-like traversal (no pole-crossing)
export function useGlobeRotation(
  options: UseGlobeRotationOptions = {}
): UseGlobeRotationReturn {
  const { idleSpeed = 0.0005, animationDuration = 1.5 } = options;

  const groupRef = useRef<THREE.Group>(null);

  // Current and target Euler angles (X = latitude tilt, Y = longitude pan)
  const currentX = useRef(0);
  const currentY = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const targetX = useRef(0);
  const targetY = useRef(0);

  const isAnimating = useRef(false);
  const animationProgress = useRef(0);

  const rotateTo = useCallback(
    (lat: number, lng: number) => {
      if (!groupRef.current) return;

      // Target X rotation: tilt so the latitude appears at the top of the globe
      // latitude 0 (equator) needs -90° X rotation to bring equator to top
      // latitude 90 (north pole) needs 0° X rotation (already at top)
      // latitude -90 (south pole) needs -180° X rotation
      const newTargetX = -(90 - lat) * DEG_TO_RAD;

      // Target Y rotation: pan so the longitude faces the camera
      // Negate because rotating the globe left shows the right side
      const newTargetY = -lng * DEG_TO_RAD;

      // Capture current interpolated position as start
      startX.current = currentX.current;
      startY.current = currentY.current;

      targetX.current = newTargetX;

      // Ensure Y takes the shortest path (wrap around -PI to PI)
      const deltaY = normalizeAngle(newTargetY - startY.current);
      targetY.current = startY.current + deltaY;

      isAnimating.current = true;
      animationProgress.current = 0;
    },
    []
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isAnimating.current) {
      animationProgress.current += delta / animationDuration;

      if (animationProgress.current >= 1) {
        animationProgress.current = 1;
        isAnimating.current = false;
      }

      // Smoothstep easing
      const t = animationProgress.current;
      const eased = t * t * (3 - 2 * t);

      // Interpolate X and Y independently
      currentX.current = startX.current + (targetX.current - startX.current) * eased;
      currentY.current = startY.current + (targetY.current - startY.current) * eased;

      // Apply as Euler rotation: Y first (longitude), then X (latitude)
      groupRef.current.rotation.set(currentX.current, currentY.current, 0, "YXZ");
    } else {
      // Idle: very slow drift on Y axis (horizontal pan)
      currentY.current += idleSpeed * delta;
      groupRef.current.rotation.y = currentY.current;
    }
  });

  return { groupRef, rotateTo };
}
