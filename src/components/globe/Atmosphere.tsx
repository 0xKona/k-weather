"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface AtmosphereProps {
  radius?: number;
}

// Fresnel-based atmosphere glow rendered on the inside of a slightly larger sphere
const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-worldPos.xyz);
    gl_Position = projectionMatrix * worldPos;
  }
`;

const fragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    // Fresnel effect: glow strongest at edges (grazing angle)
    float intensity = pow(1.0 - dot(vNormal, vViewDir), 3.0);
    vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
    gl_FragColor = vec4(atmosphereColor, intensity * 0.6);
  }
`;

export function Atmosphere({ radius = 6 }: AtmosphereProps) {
  const uniforms = useMemo(() => ({}), []);

  return (
    <mesh>
      <sphereGeometry args={[radius * 1.02, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
