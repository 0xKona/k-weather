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
// Distance of the directional light from the globe centre — large enough that
// it acts as a parallel (sun-like) light source across the whole globe
const SUN_DISTANCE = 400;

// ─── Animated directional light ───────────────────────────────────────────────
// Lives inside the rotating globe group, positioned along the sun direction in
// the globe's Earth-fixed local frame. Because it's a child of the group it
// rotates with the globe like a real sun-Earth system, so the light always
// shines from the correct direction no matter which location is selected.
// Position and intensity are lerped so sun-direction changes (e.g. weather
// refresh) transition smoothly rather than snapping.

interface SunLightProps {
  sunPosition: SunPosition;
  targetRef: React.RefObject<THREE.Object3D | null>;
}

function SunLight({ sunPosition, targetRef }: SunLightProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  // Point the light at the globe centre (the group's local origin) so the
  // beam direction is exact in world space
  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
    }
  }, [targetRef]);

  // Initialize once on mount so the light doesn't start at the origin
  useEffect(() => {
    if (!lightRef.current) return;
    lightRef.current.position
      .copy(sunPosition.position)
      .multiplyScalar(SUN_DISTANCE);
    lightRef.current.intensity = sunPosition.intensity;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    if (!lightRef.current) return;
    const speed = Math.min(1, delta * 1.5);
    const target = new THREE.Vector3()
      .copy(sunPosition.position)
      .multiplyScalar(SUN_DISTANCE);
    lightRef.current.position.lerp(target, speed);
    lightRef.current.intensity +=
      (sunPosition.intensity - lightRef.current.intensity) * speed;
  });

  return <directionalLight ref={lightRef} color={0xfff5e0} />;
}

// ─── Globe group ──────────────────────────────────────────────────────────────

function GlobeGroup({
  targetLat,
  targetLng,
  countryCode,
  sunPosition,
}: {
  targetLat: number | null;
  targetLng: number | null;
  countryCode: string | null;
  sunPosition: SunPosition;
}) {
  const groupRef = useRef<THREE.Group>(null);
  // Holds the destination quaternion — updated when lat/lng changes, never set directly on the mesh
  const targetQuaternion = useRef(new THREE.Quaternion());
  // Target for the directional light — sits at the globe centre (local origin)
  const lightTargetRef = useRef<THREE.Object3D>(null);
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

  // Unit sun direction in the globe's Earth-fixed local frame — used by the
  // terminator shader, which computes day/night from the local surface normal
  const sunDirection = sunPosition.position.clone().normalize();

  return (
    <group ref={groupRef} position={[0, GLOBE_Y, 0]}>
      <SunLight sunPosition={sunPosition} targetRef={lightTargetRef} />
      <object3D ref={lightTargetRef} />
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
  // Default sun while weather data loads — a day-side direction in the globe's
  // Earth-fixed local frame
  const defaultSun: SunPosition = {
    position: new THREE.Vector3(0, 0.2419, 0.9703).normalize(),
    isDay: true,
    intensity: 1.0,
  };

  const sun = sunPosition ?? defaultSun;

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
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent", zIndex: 10 }}
      >
        {/* Low ambient — keeps shadow side visible without washing out normal maps */}
        <ambientLight intensity={0.35} />
        <Suspense fallback={null}>
          <GlobeGroup
            targetLat={targetLat}
            targetLng={targetLng}
            countryCode={countryCode}
            sunPosition={sun}
          />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
