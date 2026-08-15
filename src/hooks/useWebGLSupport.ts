"use client";

import { useState, useEffect } from "react";
import { isWebGLAvailable } from "@/lib/webgl";

// Returns null until the probe has run (server + first client render), then
// true/false depending on whether a WebGL2 context can be created.
// Used to decide whether to mount the 3D globe and whether to show a
// "WebGL not supported" warning.
export function useWebGLSupport(): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    setAvailable(isWebGLAvailable());
  }, []);

  return available;
}
