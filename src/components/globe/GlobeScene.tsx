"use client";

import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import * as THREE from "three";
import { Globe } from "./Globe";
import { CountryOutline } from "./CountryOutline";
import { latLngToQuaternion, latLngToUnitVector } from "@/lib/coordinates";
import type { SunPosition } from "@/hooks";

interface GlobeSceneProps {
  targetLat?: number | null;
  targetLng?: number | null;
  countryCode?: string | null;
  sunPosition?: SunPosition;
}

// Globe large enough that only the curved horizon is visible in the viewport
const GLOBE_RADIUS = 50;
// Push the globe centre below the camera so the horizon fills the lower half
const GLOBE_Y = -55;

// ─── Animated directional light ───────────────────────────────────────────────
// Smoothly interpolates the sun's position and intensity each frame so
// transitions between locations don't cause an abrupt lighting change.

interface SunLightProps {
  sunPosition: SunPosition;
}

function SunLight({ sunPosition }: SunLightProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame((_, delta) => {
    if (!lightRef.current) return;
    const speed = Math.min(1, delta * 1.5);
    lightRef.current.position.lerp(sunPosition.position, speed);
    lightRef.current.intensity +=
      (sunPosition.intensity - lightRef.current.intensity) * speed;
  });

  return (
    <directionalLight
      ref={lightRef}
      position={sunPosition.position}
      intensity={sunPosition.intensity}
      color={0xfff5e0}
    />
  );
}

// ─── Globe group ──────────────────────────────────────────────────────────────

function GlobeGroup({
  targetLat,
  targetLng,
  countryCode,
  sunDirection,
}: {
  targetLat: number | null;
  targetLng: number | null;
  countryCode: string | null;
  sunDirection: THREE.Vector3;
}) {
  const groupRef = useRef<THREE.Group>(null);
  // Holds the destination quaternion — updated when lat/lng changes, never set directly on the mesh
  const targetQuaternion = useRef(new THREE.Quaternion());
  const [geoJson, setGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);

  // Load GeoJSON lazily — only when a location with a country code is first selected
  useEffect(() => {
    if (!countryCode || geoJson) return;
    fetch("/data/countries.geojson")
      .then((r) => r.json())
      .then(setGeoJson)
      .catch(() => null);
  }, [countryCode, geoJson]);

  useEffect(() => {
    if (targetLat == null || targetLng == null) {
      targetQuaternion.current.identity();
      return;
    }

    const [qx, qy, qz, qw] = latLngToQuaternion(targetLat, targetLng);
    targetQuaternion.current.set(qx, qy, qz, qw);
  }, [targetLat, targetLng]);

  // Each frame, slerp toward the target quaternion — gives smooth rotation animation
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Speed factor: higher = faster. 2.5 gives ~0.4s to reach destination
    const speed = 2.5;
    groupRef.current.quaternion.slerp(
      targetQuaternion.current,
      1 - Math.exp(-speed * delta)
    );
  });

  const pinPosition =
    targetLat != null && targetLng != null
      ? (latLngToUnitVector(targetLat, targetLng).map(
          (v) => v * (GLOBE_RADIUS + 0.35)
        ) as [number, number, number])
      : null;

  return (
    <group ref={groupRef} position={[0, GLOBE_Y, 0]}>
      <Globe radius={GLOBE_RADIUS} sunDirection={sunDirection} />
      <CountryOutline
        countryCode={countryCode}
        radius={GLOBE_RADIUS}
        geoJson={geoJson}
      />
      {pinPosition && (
        <mesh position={pinPosition}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
      )}
    </group>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────

export function GlobeScene({
  targetLat = null,
  targetLng = null,
  countryCode = null,
  sunPosition,
}: GlobeSceneProps) {
  // Default sun direction while weather data loads — midday, slightly west
  const defaultSun: SunPosition = {
    position: new THREE.Vector3(-8, 5, 8).normalize().multiplyScalar(200),
    isDay: true,
    intensity: 3.0,
  };

  const sun = sunPosition ?? defaultSun;
  // Normalised direction vector for the terminator shader
  const sunDirection = sun.position.clone().normalize();

  return (
    <div className="absolute inset-0 w-full h-full" aria-hidden="true">
      <Canvas
        camera={{
          fov: 45,
          near: 0.1,
          far: 500,
          // Camera sits above and slightly in front, looking down at the horizon
          position: [0, 10, 12],
        }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#000000" }}
      >
        {/* Low ambient — keeps shadow side visible without washing out normal maps */}
        <ambientLight intensity={0.35} />
        {/* Sun-derived directional light — position and intensity animate per location */}
        <SunLight sunPosition={sun} />
        <Suspense fallback={null}>
          <GlobeGroup
            targetLat={targetLat}
            targetLng={targetLng}
            countryCode={countryCode}
            sunDirection={sunDirection}
          />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
