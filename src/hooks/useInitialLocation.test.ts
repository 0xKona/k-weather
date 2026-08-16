import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useInitialLocation, requestUserLocation } from "./useInitialLocation";
import { reverseGeocode, LONDON_DEFAULT } from "@/services/geocodingApi";
import type { GeocodingResult } from "@/types";

// Mock only reverseGeocode — LONDON_DEFAULT comes through as the real value
vi.mock("@/services/geocodingApi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/geocodingApi")>();
  return { ...actual, reverseGeocode: vi.fn() };
});

const mockReverseGeocode = vi.mocked(reverseGeocode);

const MOCK_LOCATION: GeocodingResult = {
  id: 5128581,
  name: "New York",
  latitude: 40.7128,
  longitude: -74.006,
  country: "United States",
  country_code: "US",
  timezone: "America/New_York",
  admin1: "New York",
};

type GeolocationImpl = (
  success: (position: GeolocationPosition) => void,
  error?: (err: GeolocationPositionError) => void
) => void;

function stubGeolocation(impl: GeolocationImpl) {
  Object.defineProperty(navigator, "geolocation", {
    value: {
      getCurrentPosition: impl,
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    },
    configurable: true,
  });
}

function unstubGeolocation() {
  Object.defineProperty(navigator, "geolocation", {
    value: undefined,
    configurable: true,
  });
}

function makeCoords(latitude: number, longitude: number): GeolocationPosition {
  return {
    coords: {
      latitude,
      longitude,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({}),
    },
    timestamp: Date.now(),
    toJSON: () => ({}),
  };
}

describe("useInitialLocation", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    unstubGeolocation();
  });

  afterEach(() => {
    vi.clearAllMocks();
    unstubGeolocation();
  });

  it("falls back to London when no URL params are set", async () => {
    const { result } = renderHook(() => useInitialLocation());

    await waitFor(() => expect(result.current.isResolving).toBe(false));
    expect(result.current.initialLocation).toEqual(LONDON_DEFAULT);
    // No geolocation and no reverse geocoding on a plain load
    expect(mockReverseGeocode).not.toHaveBeenCalled();
  });

  it("restores a location from URL params via reverse geocoding", async () => {
    window.history.replaceState(null, "", "/?lat=40.7128&lng=-74.006");
    mockReverseGeocode.mockResolvedValue(MOCK_LOCATION);

    const { result } = renderHook(() => useInitialLocation());

    await waitFor(() =>
      expect(result.current.initialLocation).toEqual(MOCK_LOCATION)
    );
    expect(mockReverseGeocode).toHaveBeenCalledWith(40.7128, -74.006);
  });

  it("falls back to the raw coordinates when reverse geocoding fails", async () => {
    window.history.replaceState(null, "", "/?lat=40.7128&lng=-74.006");
    mockReverseGeocode.mockResolvedValue(null);

    const { result } = renderHook(() => useInitialLocation());

    await waitFor(() => expect(result.current.isResolving).toBe(false));
    expect(result.current.initialLocation?.latitude).toBe(40.7128);
    expect(result.current.initialLocation?.longitude).toBe(-74.006);
  });
});

describe("requestUserLocation", () => {
  beforeEach(() => {
    unstubGeolocation();
  });

  afterEach(() => {
    vi.clearAllMocks();
    unstubGeolocation();
  });

  it("resolves a reverse-geocoded location from granted geolocation", async () => {
    stubGeolocation((success) => success(makeCoords(10, 20)));
    mockReverseGeocode.mockResolvedValue(MOCK_LOCATION);

    await expect(requestUserLocation()).resolves.toEqual(MOCK_LOCATION);
    expect(mockReverseGeocode).toHaveBeenCalledWith(10, 20);
  });

  it("resolves to null when geolocation is denied", async () => {
    stubGeolocation((_success, error) =>
      error?.({
        code: 1,
        message: "denied",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      })
    );

    await expect(requestUserLocation()).resolves.toBeNull();
    expect(mockReverseGeocode).not.toHaveBeenCalled();
  });

  it("resolves to null when geolocation is unsupported", async () => {
    await expect(requestUserLocation()).resolves.toBeNull();
    expect(mockReverseGeocode).not.toHaveBeenCalled();
  });
});
