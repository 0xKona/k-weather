"use client";

import { useState, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GlobeScene } from "@/components/globe";
import { LocationSearch } from "@/components/search";
import { WeatherCard, HourlyForecast, WebGLWarning, LoadingState } from "@/components/weather";
import { Button } from "@/components/ui/button";
import { LocationTitle, LocalTime } from "@/components/typography";
import { glassPanel } from "@/lib/glass";
import { cn } from "@/lib/utils";
import {
  useWeatherData,
  useInitialLocation,
  useUrlLocation,
  useSunPosition,
  useWebGLSupport,
  useTemperatureUnit,
  requestUserLocation,
} from "@/hooks";
import type { GeocodingResult } from "@/types";

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Resolves the initial location: URL params → London default
  // (geolocation is never requested automatically — only on user gesture)
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

  // Request the user's location on demand — consent is given via the browser
  // permission prompt, which is only ever triggered by this explicit gesture
  const handleLocate = async () => {
    if (isLocating) return;
    setIsLocating(true);
    const location = await requestUserLocation();
    setIsLocating(false);

    if (location) {
      setSelectedLocation(location);
      toast.success(`Showing weather for ${location.name}`);
    } else {
      toast.error(
        "Location access was denied or unavailable. Check your browser's permission settings and try again."
      );
    }
  };

  // Day/night at the selected location — drives the glass tint of the
  // weather card and search input so they hold contrast against the globe
  const isDay = weather ? weather.current_weather.is_day === 1 : true;

  // WebGL support is probed client-side. Drives both the globe (Canvas only
  // mounts when true) and the "WebGL not supported" warning (only when false).
  const webglAvailable = useWebGLSupport();

  // Temperature unit preference (°C default) — toggled by clicking any
  // temperature, persisted to localStorage
  const { unit: temperatureUnit, toggleUnit: toggleTemperatureUnit } = useTemperatureUnit();

  // Visible loading placeholder for the weather panels. Rendered whenever
  // there's no data and no fetch in flight — including the server-rendered
  // HTML, so a slow connection that never finishes hydrating still shows a
  // card instead of a blank area. Identical on server and first client render
  // (no hydration mismatch).
  const showLoadingState = !weather && !isLoading && !error;

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
        webglAvailable={webglAvailable}
      />

      {/* Layer 2: Location typography — above background but behind globe */}
      <div className="absolute inset-x-0 top-[12%] z-5 flex justify-center pointer-events-none px-4">
        <LocationTitle
          locationName={selectedLocation?.name ?? null}
          country={selectedLocation?.country ?? null}
          animationDelay={0}
        />
      </div>

      {/* Layer 2b: Local time + controls — below the location text, above globe */}
      <div className="absolute inset-x-0 top-[12%] z-20 flex flex-col items-center gap-6 px-4 pt-32 md:pt-40 lg:pt-48 pointer-events-none">
        <LocalTime
          localTime={weather?.current_weather?.time ?? null}
          animationDelay={0.2}
        />
        <div className="pointer-events-auto w-full max-w-md">
          <LocationSearch onLocationSelect={setSelectedLocation} isDay={isDay} />
        </div>
        <div className="pointer-events-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLocate}
            disabled={isLocating}
            className={cn("rounded-xl", glassPanel(isDay))}
          >
            {isLocating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <MapPin className="size-3.5" />
            )}
            {isLocating ? "Locating…" : "Use my location"}
          </Button>
        </div>
      </div>

      {/* Layer 3: Weather panels — weather card above collapsible forecast, bottom-center */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-4 p-4 md:p-6 pb-8 pointer-events-none">
        {webglAvailable === false && (
          <div className="pointer-events-auto w-full max-w-md">
            <WebGLWarning shown />
          </div>
        )}
        {showLoadingState && (
          <div className="pointer-events-auto w-full max-w-md">
            <LoadingState isDay={isDay} />
          </div>
        )}
        <div className="pointer-events-auto w-full max-w-md">
          <WeatherCard
            weather={weather}
            isLoading={isLoading && !isResolving}
            animationDelay={1.2}
            unit={temperatureUnit}
            onToggleUnit={toggleTemperatureUnit}
          />
        </div>
        <div className="pointer-events-auto w-full max-w-md">
          <HourlyForecast
            weather={weather}
            isLoading={isLoading && !isResolving}
            animationDelay={1.4}
            unit={temperatureUnit}
            onToggleUnit={toggleTemperatureUnit}
          />
        </div>
      </div>
    </main>
  );
}
