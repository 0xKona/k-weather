"use client";

import { useRef } from "react";
import { useTexture, shaderMaterial } from "@react-three/drei";
import { useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";

interface GlobeProps {
  radius?: number;
}

// Fresnel-based atmospheric glow — bright at the horizon edge, transparent in the centre
const AtmosphereMaterial = shaderMaterial(
  { atmosphereColor: new THREE.Color(0x2266ff), intensity: 0.8 },
  // Vertex shader — passes the normal and view direction to the fragment shader
  /*glsl*/ `
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-worldPos.xyz);
      gl_Position = projectionMatrix * worldPos;
    }
  `,
  // Fragment shader — fresnel: bright at grazing angles, transparent face-on
  /*glsl*/ `
    uniform vec3 atmosphereColor;
    uniform float intensity;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.0);
      gl_FragColor = vec4(atmosphereColor, fresnel * intensity);
    }
  `
);

extend({ AtmosphereMaterial });

// Teach TypeScript about the extended JSX element
declare module "@react-three/fiber" {
  interface ThreeElements {
    atmosphereMaterial: React.PropsWithChildren<{
      atmosphereColor?: THREE.Color;
      intensity?: number;
      transparent?: boolean;
      depthWrite?: boolean;
      blending?: THREE.Blending;
      side?: THREE.Side;
    }>;
  }
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
          normalScale={new THREE.Vector2(5, 5)}
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
          opacity={0.5}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Atmospheric glow — fresnel shader renders only the horizon ring */}
      <mesh>
        <sphereGeometry args={[radius + 0.2, 64, 64]} />
        <atmosphereMaterial
          atmosphereColor={new THREE.Color(0x2266ff)}
          intensity={0.2}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  );
}
