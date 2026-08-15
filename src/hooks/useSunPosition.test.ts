import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { useSunPosition } from "./useSunPosition";
import { latLngToUnitVector } from "@/lib/coordinates";
import type { WeatherResponse } from "@/types";

// London, 12:00 BST (UTC 11:00) on 2026-08-13. Sunrise 05:47, sunset 20:17.
const londonWeather: WeatherResponse = {
  latitude: 51.5085,
  longitude: -0.1257,
  current_weather: {
    temperature: 18,
    windspeed: 10,
    winddirection: 200,
    weathercode: 0,
    is_day: 1,
    time: "2026-08-13T12:00",
  },
  daily: {
    time: ["2026-08-13"],
    sunrise: ["2026-08-13T05:47"],
    sunset: ["2026-08-13T20:17"],
  },
  utc_offset_seconds: 3600,
};

const LONDON_LAT = 51.5085;
const LONDON_LNG = -0.1257;
const PARIS_LAT = 48.8566;
const PARIS_LNG = 2.3522;

// Expected sun direction at 2026-08-13T11:00Z (subsolar point ≈ 14.43°N, 16.12°E)
const EXPECTED_SUN = new THREE.Vector3(
  0.9303720838873426,
  0.2491703610630144,
  -0.2689273446320594
);

describe("useSunPosition", () => {
  it("returns a neutral default when no weather or location is available", () => {
    const { result } = renderHook(() => useSunPosition(null, null, null));

    expect(result.current.isDay).toBe(true);
    expect(result.current.intensity).toBe(1.0);
    expect(result.current.position.length()).toBeCloseTo(1, 5);
  });

  it("points the sun at the subsolar point for the weather's UTC time", () => {
    const { result } = renderHook(() =>
      useSunPosition(londonWeather, LONDON_LAT, LONDON_LNG)
    );

    expect(result.current.position.x).toBeCloseTo(EXPECTED_SUN.x, 4);
    expect(result.current.position.y).toBeCloseTo(EXPECTED_SUN.y, 4);
    expect(result.current.position.z).toBeCloseTo(EXPECTED_SUN.z, 4);
  });

  it("is day at midday and derives intensity from the sun's elevation", () => {
    const { result } = renderHook(() =>
      useSunPosition(londonWeather, LONDON_LAT, LONDON_LNG)
    );

    expect(result.current.isDay).toBe(true);
    expect(result.current.intensity).toBeGreaterThan(1.0);

    const [lx, ly, lz] = latLngToUnitVector(LONDON_LAT, LONDON_LNG);
    const sinAlt = result.current.position.dot(new THREE.Vector3(lx, ly, lz));
    expect(result.current.intensity).toBeCloseTo(
      1.0 + Math.max(0, sinAlt) * 2.5,
      5
    );
  });

  it("returns the same Earth-fixed sun direction regardless of the selected location", () => {
    // The sun depends only on UTC, so rotating the globe to a different
    // location must not change the direction — only brightness may differ.
    const { result, rerender } = renderHook(
      ({ lat, lng }) => useSunPosition(londonWeather, lat, lng),
      {
        initialProps: {
          lat: LONDON_LAT as number | null,
          lng: LONDON_LNG as number | null,
        },
      }
    );

    const londonSun = result.current.position.clone();
    expect(londonSun).not.toEqual(new THREE.Vector3());

    rerender({ lat: PARIS_LAT, lng: PARIS_LNG });

    expect(result.current.position).toEqual(londonSun);
  });

  it("is night when the weather time is outside the sunrise/sunset window", () => {
    const nightWeather: WeatherResponse = {
      ...londonWeather,
      current_weather: {
        ...londonWeather.current_weather,
        is_day: 0,
        time: "2026-08-13T22:00",
      },
    };

    const { result } = renderHook(() =>
      useSunPosition(nightWeather, LONDON_LAT, LONDON_LNG)
    );

    expect(result.current.isDay).toBe(false);
    expect(result.current.intensity).toBe(0.15);
  });

  it("is day just before sunset (timezone-correct window check)", () => {
    // Local 19:30 BST, sunset at 20:00 BST — still daylight. The window check
    // must compare UTC instants, not add/subtract the offset asymmetrically.
    const duskWeather: WeatherResponse = {
      ...londonWeather,
      current_weather: {
        ...londonWeather.current_weather,
        is_day: 1,
        time: "2026-08-13T19:30",
      },
      daily: {
        time: ["2026-08-13"],
        sunrise: ["2026-08-13T05:47"],
        sunset: ["2026-08-13T20:00"],
      },
    };

    const { result } = renderHook(() =>
      useSunPosition(duskWeather, LONDON_LAT, LONDON_LNG)
    );

    expect(result.current.isDay).toBe(true);
    expect(result.current.intensity).toBeGreaterThan(1.0);
  });

  it("falls back to the sun's elevation when no daily data is present", () => {
    const noDaily = { ...londonWeather, daily: undefined };

    const { result } = renderHook(() =>
      useSunPosition(noDaily, LONDON_LAT, LONDON_LNG)
    );

    // Midday in London — the sun is above the horizon even without daily data
    expect(result.current.isDay).toBe(true);
    expect(result.current.intensity).toBeGreaterThan(1.0);
  });
});
