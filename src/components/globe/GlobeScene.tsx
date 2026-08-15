"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import * as THREE from "three";
import { Globe } from "./Globe";
import { latLngToQuaternion, latLngToUnitVector } from "@/lib/coordinates";

interface GlobeSceneProps {
  targetLat?: number | null;
  targetLng?: number | null;
}

// Globe large enough that only the curved horizon is visible in the viewport
const GLOBE_RADIUS = 50;
// Push the globe centre below the camera so the horizon fills the lower half
const GLOBE_Y = -55;

function GlobeGroup({ targetLat, targetLng }: { targetLat: number | null; targetLng: number | null }) {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;
    if (targetLat == null || targetLng == null) {
      groupRef.current.quaternion.identity();
      return;
    }

    const [qx, qy, qz, qw] = latLngToQuaternion(targetLat, targetLng);
    groupRef.current.quaternion.set(qx, qy, qz, qw);
  }, [targetLat, targetLng]);

  // Debug pin — scaled to globe radius
  const pinPosition = targetLat != null && targetLng != null
    ? latLngToUnitVector(targetLat, targetLng).map(v => v * (GLOBE_RADIUS + 0.2)) as [number, number, number]
    : null;

  return (
    <group ref={groupRef} position={[0, GLOBE_Y, 0]}>
      <Globe radius={GLOBE_RADIUS} />
      {pinPosition && (
        <mesh position={pinPosition}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="red" />
        </mesh>
      )}
    </group>
  );
}

export function GlobeScene({ targetLat = null, targetLng = null }: GlobeSceneProps) {
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
        {/* Ambient kept very low so normal map shadow contrast reads clearly */}
        <ambientLight intensity={0.06} />
        {/* Sun-side directional light — strong enough to bring out normal map depth */}
        <directionalLight position={[10, 5, 8]} intensity={2.2} color={0xfff5e0} />
        <Suspense fallback={null}>
          <GlobeGroup targetLat={targetLat} targetLng={targetLng} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
