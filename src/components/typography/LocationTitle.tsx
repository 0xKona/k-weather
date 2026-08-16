"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface LocationTitleProps {
  locationName: string | null;
  country: string | null;
  animationDelay?: number;
}

export function LocationTitle({ locationName, country, animationDelay = 0 }: LocationTitleProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!locationName) return null;

  const variants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit:    { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        exit:    { opacity: 0, y: -20 },
      };

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const, delay: animationDelay };

  // Country animates in slightly ahead of the city name
  const countryTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const, delay: animationDelay };

  return (
    <AnimatePresence>
      <motion.div
        key={locationName}
        aria-hidden="true"
        className="pointer-events-none select-none flex flex-col items-center text-center absolute inset-0"
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={transition}
      >
        {/* Country — smaller, above, centred */}
        {country && (
          <motion.p
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={countryTransition}
            className="text-sm md:text-base font-semibold uppercase tracking-[0.3em] text-foreground/60 drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)] mb-2"
          >
            {country}
          </motion.p>
        )}

        {/* City name — large, centred */}
        <h1 className="text-8xl md:text-9xl lg:text-[10rem] font-black uppercase tracking-tight text-foreground/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          {locationName.toUpperCase()}
        </h1>
      </motion.div>
    </AnimatePresence>
  );
}
