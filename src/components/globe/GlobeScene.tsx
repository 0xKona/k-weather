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

const GLOBE_RADIUS = 2;

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

  // Debug pin position (in local/unrotated space)
  const pinPosition = targetLat != null && targetLng != null
    ? latLngToUnitVector(targetLat, targetLng).map(v => v * (GLOBE_RADIUS + 0.05)) as [number, number, number]
    : null;

  return (
    <group ref={groupRef}>
      <Globe radius={GLOBE_RADIUS} />
      {/* Red debug pin at the target location */}
      {pinPosition && (
        <mesh position={pinPosition}>
          <sphereGeometry args={[0.05, 16, 16]} />
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
          far: 100,
          position: [0, 0, 5],
        }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#000000" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={1.5} />
        <Suspense fallback={null}>
          <GlobeGroup targetLat={targetLat} targetLng={targetLng} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
