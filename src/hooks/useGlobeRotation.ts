"use client";

import { useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { latLngToSpherical } from "@/lib/coordinates";

interface UseGlobeRotationOptions {
  idleSpeed?: number;
  animationDuration?: number;
}

interface UseGlobeRotationReturn {
  groupRef: React.RefObject<THREE.Group | null>;
  rotateTo: (lat: number, lng: number) => void;
}

// Manages globe rotation with smooth animated transitions to target coordinates
export function useGlobeRotation(
  options: UseGlobeRotationOptions = {}
): UseGlobeRotationReturn {
  const { idleSpeed = 0.0005, animationDuration = 1.5 } = options;

  const groupRef = useRef<THREE.Group>(null);
  const targetQuaternion = useRef(new THREE.Quaternion());
  const isAnimating = useRef(false);
  const animationProgress = useRef(0);
  const startQuaternion = useRef(new THREE.Quaternion());

  const rotateTo = useCallback(
    (lat: number, lng: number) => {
      if (!groupRef.current) return;

      const { phi, theta } = latLngToSpherical(lat, lng);

      // The point on the unit sphere for this lat/lng (before any globe rotation)
      // In Three.js: Y is up, phi is from +Y axis, theta is around Y axis
      const pointDir = new THREE.Vector3(
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.cos(theta)
      );

      // We want this point to end up at the top of the globe (+Y direction)
      // facing the camera. Compute the rotation that brings pointDir to +Y.
      const upDir = new THREE.Vector3(0, 1, 0);

      // Quaternion that rotates pointDir onto upDir
      const rotation = new THREE.Quaternion();
      rotation.setFromUnitVectors(pointDir.normalize(), upDir);

      targetQuaternion.current.copy(rotation);

      // Capture current rotation as start point
      startQuaternion.current.copy(groupRef.current.quaternion);

      isAnimating.current = true;
      animationProgress.current = 0;
    },
    []
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isAnimating.current) {
      // Ease-in-out progress curve
      animationProgress.current += delta / animationDuration;

      if (animationProgress.current >= 1) {
        animationProgress.current = 1;
        isAnimating.current = false;
      }

      // Smoothstep easing for natural feel
      const t = animationProgress.current;
      const eased = t * t * (3 - 2 * t);

      // Slerp between start and target rotation
      groupRef.current.quaternion.slerpQuaternions(
        startQuaternion.current,
        targetQuaternion.current,
        eased
      );
    } else {
      // Idle: very slow drift rotation around Y axis
      groupRef.current.rotation.y += idleSpeed * delta;
    }
  });

  return { groupRef, rotateTo };
}
