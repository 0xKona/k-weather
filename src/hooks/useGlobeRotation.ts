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
  const { idleSpeed = 0.001, animationDuration = 1.5 } = options;

  const groupRef = useRef<THREE.Group>(null);
  const targetQuaternion = useRef(new THREE.Quaternion());
  const isAnimating = useRef(false);
  const animationProgress = useRef(0);
  const startQuaternion = useRef(new THREE.Quaternion());

  const rotateTo = useCallback(
    (lat: number, lng: number) => {
      if (!groupRef.current) return;

      const { phi, theta } = latLngToSpherical(lat, lng);

      // Target rotation: position the location at the top of the visible horizon
      const euler = new THREE.Euler(-(Math.PI / 2 - phi), -theta, 0, "YXZ");
      targetQuaternion.current.setFromEuler(euler);

      // Capture current rotation as start point
      startQuaternion.current.copy(groupRef.current.quaternion);

      isAnimating.current = true;
      animationProgress.current = 0;
    },
    [animationDuration]
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
      // Idle: slow drift rotation around Y axis
      groupRef.current.rotation.y += idleSpeed * delta;
    }
  });

  return { groupRef, rotateTo };
}
