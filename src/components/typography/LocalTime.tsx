"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface LocalTimeProps {
  // ISO 8601 local time at the location e.g. "2026-08-15T12:30"
  localTime: string | null;
  animationDelay?: number;
}

// Extract the local "HH:MM" from an ISO local time string e.g. "2026-08-15T12:30"
function formatTime(localIso: string): string {
  return localIso.slice(11, 16);
}

export function LocalTime({ localTime, animationDelay = 0 }: LocalTimeProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!localTime) return null;

  const variants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit:    { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit:    { opacity: 0, y: -12 },
      };

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const, delay: animationDelay };

  return (
    <div className="relative flex h-6 w-full items-center justify-center md:h-7">
      <AnimatePresence>
        <motion.p
          key={localTime}
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-x-0 text-center text-sm md:text-base font-semibold uppercase tracking-[0.3em] text-foreground/60 drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]"
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={transition}
        >
          Local Time: {formatTime(localTime)}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
