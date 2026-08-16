// Detects whether a WebGL2 context can actually be created in this browser.
// Browsers with strict fingerprinting protection (e.g. Brave) or limited GPU
// support can return null from getContext, which makes three.js's
// WebGLRenderer throw "Error creating WebGL context". Modern three.js only
// creates WebGL2 contexts, so plain WebGL1 is treated as unavailable.
export function isWebGLAvailable(): boolean {
  if (typeof document === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    return canvas.getContext("webgl2") != null;
  } catch {
    return false;
  }
}
