"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { Earth } from "./Earth";
import { Atmosphere } from "./Atmosphere";
import { Stars } from "./Stars";
import { useGlobeRotation } from "@/hooks/useGlobeRotation";
import { useDayNightCycle } from "@/hooks/useDayNightCycle";

interface GlobeSceneProps {
  targetLat?: number | null;
  targetLng?: number | null;
}

// Inner scene content — must be inside Canvas to use R3F hooks
function SceneContent({ targetLat, targetLng }: GlobeSceneProps) {
  const { groupRef, rotateTo } = useGlobeRotation();
  const sunDirection = useDayNightCycle();

  // Trigger rotation when target changes
  if (targetLat !== null && targetLng !== null && targetLat !== undefined && targetLng !== undefined) {
    rotateTo(targetLat, targetLng);
  }

  return (
    <>
      <Stars />
      <group ref={groupRef}>
        <Earth radius={6} sunDirection={sunDirection} />
        <Atmosphere radius={6} />
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
          // ISS perspective: close to globe, looking down at the horizon
          position: [0, 8, 12],
          fov: 45,
          near: 0.1,
          far: 200,
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
