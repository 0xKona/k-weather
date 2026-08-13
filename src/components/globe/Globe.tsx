"use client";

import { useTexture } from "@react-three/drei";

interface GlobeProps {
  radius?: number;
}

// Simple textured Earth sphere — day texture only, no shaders
export function Globe({ radius = 2 }: GlobeProps) {
  const dayTexture = useTexture("/textures/earth-day.jpg");

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial map={dayTexture} />
    </mesh>
  );
}
