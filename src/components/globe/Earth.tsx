"use client";

import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

interface EarthProps {
  radius?: number;
  sunDirection: React.RefObject<THREE.Vector3>;
}

// Custom shader that blends day and night textures based on sun direction
const vertexShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform vec3 sunDir;

  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    // Dot product of surface normal and sun direction determines lighting
    float intensity = dot(vNormal, sunDir);

    // Smooth transition at the terminator (not a hard edge)
    float blend = smoothstep(-0.2, 0.3, intensity);

    vec4 dayColor = texture2D(dayTexture, vUv);
    vec4 nightColor = texture2D(nightTexture, vUv);

    // Blend between night (city lights) and sunlit day texture
    gl_FragColor = mix(nightColor, dayColor, blend);
  }
`;

export function Earth({ radius = 6, sunDirection }: EarthProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const [dayMap, nightMap] = useLoader(THREE.TextureLoader, [
    "/textures/earth-day.jpg",
    "/textures/earth-night.jpg",
  ]);

  const uniforms = useMemo(
    () => ({
      dayTexture: { value: dayMap },
      nightTexture: { value: nightMap },
      sunDir: { value: new THREE.Vector3(1, 0, 0) },
    }),
    [dayMap, nightMap]
  );

  // Update sun direction uniform each frame from the hook's ref
  useFrame(() => {
    if (materialRef.current && sunDirection.current) {
      materialRef.current.uniforms.sunDir.value.copy(sunDirection.current);
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
