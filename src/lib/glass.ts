import { cn } from "@/lib/utils";

// Shared glass surface recipe for floating panels that sit over the globe.
// A single dark glass keeps the space HUD aesthetic in both day and night;
// the tint adapts so the panel holds contrast against either a bright day
// ocean (more opaque) or a dark night globe (more transparent so city lights
// glow through, with a stronger rim to separate it from the blackness).
export function glassPanel(isDay: boolean): string {
  return cn(
    "border backdrop-blur-xl",
    isDay
      ? "bg-background/85 border-white/20"
      : "bg-background/60 border-white/25",
    "shadow-[0_10px_40px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)]"
  );
}
