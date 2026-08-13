"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface LocationTitleProps {
  locationName: string | null;
  country: string | null;
}

export function LocationTitle({ locationName, country }: LocationTitleProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!locationName) return null;

  const animationVariants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
      };

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={locationName}
        aria-hidden="true"
        className="pointer-events-none select-none"
        initial={animationVariants.initial}
        animate={animationVariants.animate}
        exit={animationVariants.exit}
        transition={transition}
      >
        <h1 className="text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tight text-foreground/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          {locationName.toUpperCase()}
        </h1>
        {country && (
          <p className="text-xl md:text-2xl font-medium text-muted-foreground uppercase tracking-widest mt-2">
            {country}
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
