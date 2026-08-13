"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import * as THREE from "three";
import { Earth } from "./Earth";
import { Atmosphere } from "./Atmosphere";
import { Stars } from "./Stars";
import { useGlobeRotation } from "@/hooks/useGlobeRotation";
import { useDayNightCycle } from "@/hooks/useDayNightCycle";

interface GlobeSceneProps {
  targetLat?: number | null;
  targetLng?: number | null;
}

// Globe radius — massive so it extends beyond viewport edges
const GLOBE_RADIUS = 45;

// Globe center positioned far below camera so only the curved horizon is visible
const GLOBE_Y_OFFSET = -40;

// Camera setup for ISS perspective — fixed, no orbit controls
function CameraSetup() {
  const { camera } = useThree();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    camera.position.set(0, 12, 8);
    camera.lookAt(new THREE.Vector3(0, GLOBE_Y_OFFSET + GLOBE_RADIUS, 0));
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

// Inner scene content — must be inside Canvas to use R3F hooks
function SceneContent({ targetLat, targetLng }: GlobeSceneProps) {
  const { groupRef, rotateTo } = useGlobeRotation();
  const sunDirection = useDayNightCycle();
  const prevCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Trigger rotation only when coordinates actually change
  useEffect(() => {
    if (targetLat == null || targetLng == null) return;

    const prev = prevCoordsRef.current;
    if (prev && prev.lat === targetLat && prev.lng === targetLng) return;

    prevCoordsRef.current = { lat: targetLat, lng: targetLng };
    rotateTo(targetLat, targetLng);
  }, [targetLat, targetLng, rotateTo]);

  return (
    <>
      <CameraSetup />
      <Stars />
      <group ref={groupRef} position={[0, GLOBE_Y_OFFSET, 0]}>
        <Earth radius={GLOBE_RADIUS} sunDirection={sunDirection} />
        <Atmosphere radius={GLOBE_RADIUS} />
      </group>
    </>
  );
}

// Full-viewport R3F Canvas with ISS-perspective camera
export function GlobeScene({ targetLat = null, targetLng = null }: GlobeSceneProps) {
  return (
    <div className="absolute inset-0 w-full h-full" aria-hidden="true">
      <Canvas
        camera={{
          fov: 45,
          near: 0.1,
          far: 500,
          position: [0, 12, 8],
        }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#000000" }}
      >
        <Suspense fallback={null}>
          <SceneContent targetLat={targetLat} targetLng={targetLng} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
