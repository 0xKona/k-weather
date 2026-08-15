"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { GlobeScene } from "@/components/globe";
import { LocationSearch } from "@/components/search";
import { WeatherCard } from "@/components/weather";
import { LocationTitle } from "@/components/typography";
import {
  useWeatherData,
  useInitialLocation,
  useUrlLocation,
  useSunPosition,
} from "@/hooks";
import type { GeocodingResult } from "@/types";

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null);

  // Resolves the initial location: URL params → geolocation → London default
  const { initialLocation, isResolving } = useInitialLocation();

  // Apply the initial location once resolved, but only if the user hasn't
  // already made a manual selection
  useEffect(() => {
    if (initialLocation && !selectedLocation) {
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep ?lat=x&lng=y URL params in sync with the selected location
  useUrlLocation(selectedLocation);

  const { weather, isLoading, error } = useWeatherData(
    selectedLocation?.latitude ?? null,
    selectedLocation?.longitude ?? null
  );

  // Derive realistic sun position and day/night state from weather API data
  const sunPosition = useSunPosition(
    weather,
    selectedLocation?.latitude ?? null,
    selectedLocation?.longitude ?? null
  );

  // Surface weather errors as toasts
  useEffect(() => {
    if (error) {
      toast.error("Unable to fetch weather data. Please try again.");
    }
  }, [error]);

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {/* Black background layer - z-0 */}
      <div className="absolute inset-0 bg-black" />

      {/* Layer 1: 3D Globe — full viewport canvas */}
      <GlobeScene
        targetLat={selectedLocation?.latitude}
        targetLng={selectedLocation?.longitude}
        countryCode={selectedLocation?.country_code ?? null}
        sunPosition={sunPosition}
      />

      {/* Layer 2: Location typography — above background but behind globe */}
      <div className="absolute inset-x-0 top-[12%] z-5 flex justify-center pointer-events-none px-4">
        <LocationTitle
          locationName={selectedLocation?.name ?? null}
          country={selectedLocation?.country ?? null}
          animationDelay={0}
        />
      </div>

      {/* Layer 3: UI controls — weather card above input, input bottom-center */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-4 p-4 md:p-6 pb-8 pointer-events-none">
        <div className="pointer-events-auto">
          <WeatherCard
            weather={weather}
            isLoading={isLoading && !isResolving}
            animationDelay={1.2}
          />
        </div>
        <div className="pointer-events-auto w-full max-w-md">
          <LocationSearch onLocationSelect={setSelectedLocation} />
        </div>
      </div>
    </main>
  );
}
