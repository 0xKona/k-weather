"use client";

import { useRef, Suspense, useEffect, useCallback } from "react";
import { useTexture, shaderMaterial } from "@react-three/drei";
import { useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";

interface GlobeProps {
  radius?: number;
  // Driven by useSunPosition via the weather API — more accurate than timezone-based calculation
  isDay?: boolean;
}

// ─── Atmosphere shader ────────────────────────────────────────────────────────

const AtmosphereMaterial = shaderMaterial(
  { atmosphereColor: new THREE.Color(0x2266ff), intensity: 0.8 },
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

// ─── Detail map upgrade ───────────────────────────────────────────────────────
// Suspends until normal/specular/night/clouds are ready, then writes them onto
// the already-visible material refs. Rendered inside its own Suspense so it
// doesn't block the initial globe render.

interface DetailMapsProps {
  surfaceRef: React.RefObject<THREE.MeshPhongMaterial | null>;
  nightMatRef: React.RefObject<THREE.MeshBasicMaterial | null>;
  cloudsMatRef: React.RefObject<THREE.MeshPhongMaterial | null>;
  onLoaded: () => void;
}

function DetailMaps({ surfaceRef, nightMatRef, cloudsMatRef, onLoaded }: DetailMapsProps) {
  const [nightMap, normalMap, specularMap, cloudsMap] = useTexture([
    "/textures/8k_earth_nightmap.jpg",
    "/textures/8k_earth_normal_map.jpg",
    "/textures/8k_earth_specular_map.jpg",
    "/textures/8k_earth_clouds.jpg",
  ]);

  // Apply textures with normalScale and cloud opacity starting at 0 — animated up in useFrame
  // hasApplied guard ensures this never runs more than once even if deps re-evaluate
  const hasApplied = useRef(false);
  useEffect(() => {
    if (hasApplied.current) return;
    hasApplied.current = true;

    if (surfaceRef.current) {
      surfaceRef.current.normalMap = normalMap;
      surfaceRef.current.normalScale.set(0, 0);
      surfaceRef.current.specularMap = specularMap;
      surfaceRef.current.needsUpdate = true;
    }
    if (nightMatRef.current) {
      nightMatRef.current.map = nightMap;
      nightMatRef.current.needsUpdate = true;
    }
    if (cloudsMatRef.current) {
      cloudsMatRef.current.map = cloudsMap;
      cloudsMatRef.current.alphaMap = cloudsMap;
      cloudsMatRef.current.opacity = 0;
      cloudsMatRef.current.needsUpdate = true;
    }
    onLoaded();
  }, [normalMap, specularMap, nightMap, cloudsMap, surfaceRef, nightMatRef, cloudsMatRef, onLoaded]);

  return null;
}

// ─── Globe component ──────────────────────────────────────────────────────────

export function Globe({ radius = 2, isDay = true }: GlobeProps) {
  const cloudsRef    = useRef<THREE.Mesh>(null);
  const nightRef     = useRef<THREE.MeshBasicMaterial>(null);
  const surfaceRef   = useRef<THREE.MeshPhongMaterial>(null);
  const cloudsMatRef = useRef<THREE.MeshPhongMaterial>(null);
  const detailLoaded = useRef(false);
  const onLoaded = useCallback(() => { detailLoaded.current = true; }, []);

  // Phase 1: only daymap — suspends quickly, globe appears fast
  const [dayMap] = useTexture(["/textures/8k_earth_daymap.jpg"]);

  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.003;
    }
    if (nightRef.current) {
      const target = isDay ? 0.0 : 1.0;
      nightRef.current.opacity += (target - nightRef.current.opacity) * Math.min(1, delta * 0.7);
    }

    // Fade in normal map depth and clouds after detail textures load
    if (detailLoaded.current) {
      if (surfaceRef.current) {
        const current = surfaceRef.current.normalScale.x;
        const next = current + (5 - current) * Math.min(1, delta * 1.5);
        surfaceRef.current.normalScale.set(next, next);
      }
      if (cloudsMatRef.current && cloudsMatRef.current.opacity < 0.5) {
        cloudsMatRef.current.opacity = Math.min(0.5, cloudsMatRef.current.opacity + delta * 0.6);
      }
    }
  });

  return (
    <>
      {/* Earth surface — visible immediately with daymap only */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhongMaterial
          ref={surfaceRef}
          map={dayMap}
          specular={new THREE.Color(0x4499cc)}
          shininess={18}
        />
      </mesh>

      {/* Night layer — invisible until detail maps load and isNight */}
      <mesh>
        <sphereGeometry args={[radius + 0.01, 64, 64]} />
        <meshBasicMaterial
          ref={nightRef}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Cloud layer — invisible until detail maps load */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[radius + 0.15, 64, 64]} />
        <meshPhongMaterial
          ref={cloudsMatRef}
          transparent
          opacity={0.5}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Atmospheric glow — no texture dependency, always visible */}
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

      {/* Phase 2: load detail maps in background, upgrade materials when ready */}
      <Suspense fallback={null}>
        <DetailMaps
          surfaceRef={surfaceRef}
          nightMatRef={nightRef}
          cloudsMatRef={cloudsMatRef}
          onLoaded={onLoaded}
        />
      </Suspense>
    </>
  );
}
