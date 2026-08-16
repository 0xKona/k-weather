"use client";

import { useRef, Suspense, useEffect, useCallback } from "react";
import { useTexture, shaderMaterial } from "@react-three/drei";
import { useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";

interface GlobeProps {
  radius?: number;
  // Unit direction to the sun in the globe's Earth-fixed local frame — derived
  // from useSunPosition. Used to compute the day/night terminator per-fragment
  // on the night layer. In local frame it stays correct regardless of how the
  // globe is rotated to show the selected location.
  sunDirection?: THREE.Vector3;
}

// ─── Atmosphere shader ────────────────────────────────────────────────────────

const AtmosphereMaterial = shaderMaterial(
  { atmosphereColor: new THREE.Color(0x2266ff), intensity: 0.2 },
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

// ─── Night layer shader ───────────────────────────────────────────────────────
// Renders city lights only on the night side of the globe.
// The day/night boundary (terminator) is computed per-fragment from the dot
// product of the surface normal against the sun direction — both in the
// globe's Earth-fixed local frame, so the terminator stays anchored to the
// geography no matter how the globe is rotated.
//
// dot(normal, sunDirection) > 0  → day side   → city lights invisible
// dot(normal, sunDirection) < 0  → night side → city lights visible
// Smooth transition zone around 0 gives a soft terminator edge.

const NightLayerMaterial = shaderMaterial(
  {
    nightMap:     null as unknown as THREE.Texture,
    // Unit direction to the sun in the globe's Earth-fixed local frame
    sunDirection: new THREE.Vector3(0, 1, 0),
    // Width of the terminator blend zone — higher = softer transition
    terminatorSoftness: 0.15,
  },
  // Vertex shader — passes UV and the local (Earth-fixed) normal to the
  // fragment shader. The globe group only rotates, so the local normal is the
  // geographic surface normal and needs no transformation.
  /*glsl*/ `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader — city lights fade in where the surface faces away from sun
  /*glsl*/ `
    uniform sampler2D nightMap;
    uniform vec3 sunDirection;
    uniform float terminatorSoftness;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      // dot > 0 = day side, dot < 0 = night side
      float sunDot = dot(normalize(vNormal), normalize(sunDirection));

      // Smoothstep maps the terminator zone:
      //   sunDot = +softness → fully day (alpha 0)
      //   sunDot = -softness → fully night (alpha 1)
      float nightAlpha = smoothstep(terminatorSoftness, -terminatorSoftness, sunDot);

      vec4 cityLights = texture2D(nightMap, vUv);

      // Use the luminance of city lights as an additional alpha factor so
      // dark ocean areas of the night map don't add a grey tint
      float luminance = dot(cityLights.rgb, vec3(0.299, 0.587, 0.114));

      gl_FragColor = vec4(cityLights.rgb, nightAlpha * luminance * 2.0);
    }
  `
);

extend({ AtmosphereMaterial, NightLayerMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    atmosphereMaterial: React.PropsWithChildren<{
      atmosphereColor?: THREE.Color;
      intensity?: number;
      transparent?: boolean;
      depthWrite?: boolean;
      blending?: THREE.Blending;
      side?: THREE.Side;
    }> &
      React.RefAttributes<THREE.ShaderMaterial>;
    nightLayerMaterial: React.PropsWithChildren<{
      nightMap?: THREE.Texture;
      sunDirection?: THREE.Vector3;
      terminatorSoftness?: number;
      transparent?: boolean;
      depthWrite?: boolean;
      blending?: THREE.Blending;
    }> &
      React.RefAttributes<
        THREE.ShaderMaterial & { sunDirection: THREE.Vector3; nightMap: THREE.Texture }
      >;
  }
}

// ─── Detail map loader ────────────────────────────────────────────────────────
// Loads secondary textures in the background after the day map is visible.
// Writes directly onto existing material refs to avoid remounting.

interface DetailMapsProps {
  surfaceRef:  React.RefObject<THREE.MeshPhongMaterial | null>;
  nightMatRef: React.RefObject<THREE.ShaderMaterial & { sunDirection: THREE.Vector3; nightMap: THREE.Texture } | null>;
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

  // hasApplied guard — runs exactly once regardless of React re-renders
  const hasApplied = useRef(false);
  useEffect(() => {
    if (hasApplied.current) return;
    hasApplied.current = true;

    if (surfaceRef.current) {
      surfaceRef.current.normalMap = normalMap;
      surfaceRef.current.normalScale.set(0, 0); // animated up in useFrame
      surfaceRef.current.specularMap = specularMap;
      surfaceRef.current.needsUpdate = true;
    }
    if (nightMatRef.current) {
      nightMatRef.current.uniforms.nightMap.value = nightMap;
      nightMatRef.current.needsUpdate = true;
    }
    if (cloudsMatRef.current) {
      cloudsMatRef.current.map = cloudsMap;
      cloudsMatRef.current.alphaMap = cloudsMap;
      cloudsMatRef.current.opacity = 0; // animated up in useFrame
      cloudsMatRef.current.needsUpdate = true;
    }
    onLoaded();
  }, [normalMap, specularMap, nightMap, cloudsMap, surfaceRef, nightMatRef, cloudsMatRef, onLoaded]);

  return null;
}

// ─── Globe component ──────────────────────────────────────────────────────────

// Default sun direction used before weather data loads — a day-side direction
// in the globe's Earth-fixed local frame (subsolar point at ~14°N, 90°W)
const DEFAULT_SUN = new THREE.Vector3(0, 0.2419, 0.9703).normalize();

export function Globe({ radius = 2, sunDirection = DEFAULT_SUN }: GlobeProps) {
  const cloudsRef    = useRef<THREE.Mesh>(null);
  const surfaceRef   = useRef<THREE.MeshPhongMaterial>(null);
  const cloudsMatRef = useRef<THREE.MeshPhongMaterial>(null);
  const nightMatRef  = useRef<THREE.ShaderMaterial & {
    sunDirection: THREE.Vector3;
    nightMap: THREE.Texture;
  }>(null);

  const detailLoaded = useRef(false);
  const onLoaded = useCallback(() => { detailLoaded.current = true; }, []);

  // Phase 1 — only daymap blocks the Suspense boundary; globe appears quickly
  const [dayMap] = useTexture(["/textures/8k_earth_daymap.jpg"]);

  useFrame((_, delta) => {
    // Slow cloud drift — independent of globe rotation
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.003;
    }

    // Keep sun direction uniform in sync — lerp for smooth transitions
    if (nightMatRef.current) {
      nightMatRef.current.uniforms.sunDirection.value.lerp(
        sunDirection,
        Math.min(1, delta * 2)
      );
    }

    // Fade in normal map and clouds once detail textures have loaded
    if (detailLoaded.current) {
      if (surfaceRef.current) {
        const cur = surfaceRef.current.normalScale.x;
        surfaceRef.current.normalScale.set(
          cur + (5 - cur) * Math.min(1, delta * 1.5),
          cur + (5 - cur) * Math.min(1, delta * 1.5)
        );
      }
      if (cloudsMatRef.current && cloudsMatRef.current.opacity < 0.5) {
        cloudsMatRef.current.opacity = Math.min(
          0.5,
          cloudsMatRef.current.opacity + delta * 0.6
        );
      }
    }
  });

  return (
    <>
      {/* ── Day surface — meshPhongMaterial completely untouched ───────────── */}
      {/* Three.js handles all Phong lighting normally. No custom shader here. */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhongMaterial
          ref={surfaceRef}
          map={dayMap}
          specular={new THREE.Color(0x4499cc)}
          shininess={18}
        />
      </mesh>

      {/* ── Night layer — terminator computed per-fragment from sun direction ─ */}
      {/* Sits just above the surface. City lights fade in on the night side.  */}
      {/* AdditiveBlending means lights add brightness; dark areas add nothing. */}
      <mesh>
        <sphereGeometry args={[radius + 0.02, 64, 64]} />
        <nightLayerMaterial
          ref={nightMatRef}
          sunDirection={sunDirection}
          terminatorSoftness={0.12}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ── Clouds — drifts independently, loaded in phase 2 ──────────────── */}
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

      {/* ── Atmospheric glow — always visible, no texture dependency ─────── */}
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

      {/* ── Phase 2 — detail maps load in background, upgrade refs on ready ─ */}
      <Suspense fallback={null}>
        <DetailMaps
          surfaceRef={surfaceRef}
          nightMatRef={nightMatRef}
          cloudsMatRef={cloudsMatRef}
          onLoaded={onLoaded}
        />
      </Suspense>
    </>
  );
}
