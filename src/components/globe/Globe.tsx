"use client";

import { useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GlobeProps {
  radius?: number;
}

// Textured Earth sphere with normal map depth, specular reflectivity, and cloud layer.
// Earth rotation logic lives in GlobeScene — this component owns only appearance.
export function Globe({ radius = 2 }: GlobeProps) {
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [dayMap, normalMap, specularMap, cloudsMap] = useTexture([
    "/textures/8k_earth_daymap.jpg",
    "/textures/8k_earth_normal_map.png",
    "/textures/8k_earth_specular_map.jpg",
    "/textures/8k_earth_clouds.jpg",
  ]);

  // Very slow independent cloud drift — does not affect earth rotation
  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.003;
    }
  });

  return (
    <>
      {/* Earth surface */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhongMaterial
          map={dayMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(2, 2)}
          specularMap={specularMap}
          specular={new THREE.Color(0x4499cc)}
          shininess={18}
        />
      </mesh>

      {/* Cloud layer — sits just above the surface, drifts independently */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[radius + 0.15, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap}
          alphaMap={cloudsMap}
          transparent
          opacity={0.9}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>
    </>
  );
}
