"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { GlobeScene } from "@/components/globe";
import { LocationSearch } from "@/components/search";
import { WeatherCard } from "@/components/weather";
import { LocationTitle } from "@/components/typography";
import { useWeatherData } from "@/hooks/useWeatherData";
import type { GeocodingResult } from "@/types";

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null);

  const { weather, isLoading, error } = useWeatherData(
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
      {/* Layer 0: 3D Globe — full viewport canvas */}
      <GlobeScene
        targetLat={selectedLocation?.latitude}
        targetLng={selectedLocation?.longitude}
        countryCode={selectedLocation?.country_code ?? null}
        timezone={selectedLocation?.timezone ?? null}
      />

      {/* Layer 1: Location typography — space area above the horizon */}
      <div className="absolute inset-x-0 top-[15%] z-10 flex justify-center pointer-events-none px-4">
        <LocationTitle
          locationName={selectedLocation?.name ?? null}
          country={selectedLocation?.country ?? null}
          animationDelay={0.75}
        />
      </div>

      {/* Layer 2: UI controls — weather card above input, input bottom-center */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-4 p-4 md:p-6 pb-8 pointer-events-none">
        <div className="pointer-events-auto">
          <WeatherCard
            weather={weather}
            isLoading={isLoading}
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
