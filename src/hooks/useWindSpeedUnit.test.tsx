import { renderHook, waitFor } from "@testing-library/react";
import { act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useWindSpeedUnit } from "./useWindSpeedUnit";
import { WIND_SPEED_UNIT_STORAGE_KEY } from "@/lib/speed";

describe("useWindSpeedUnit", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("defaults to kph when nothing is stored", async () => {
    const { result } = renderHook(() => useWindSpeedUnit());
    expect(result.current.unit).toBe("kph");
  });

  it("applies a saved mph preference after mount", async () => {
    window.localStorage.setItem(WIND_SPEED_UNIT_STORAGE_KEY, "mph");
    const { result } = renderHook(() => useWindSpeedUnit());
    await waitFor(() => expect(result.current.unit).toBe("mph"));
  });

  it("ignores an invalid stored value", async () => {
    window.localStorage.setItem(WIND_SPEED_UNIT_STORAGE_KEY, "knots");
    const { result } = renderHook(() => useWindSpeedUnit());
    expect(result.current.unit).toBe("kph");
  });

  it("toggles the unit and persists it", async () => {
    const { result } = renderHook(() => useWindSpeedUnit());
    expect(result.current.unit).toBe("kph");

    act(() => result.current.toggleUnit());
    expect(result.current.unit).toBe("mph");
    expect(window.localStorage.getItem(WIND_SPEED_UNIT_STORAGE_KEY)).toBe("mph");

    act(() => result.current.toggleUnit());
    expect(result.current.unit).toBe("kph");
    expect(window.localStorage.getItem(WIND_SPEED_UNIT_STORAGE_KEY)).toBe("kph");
  });

  it("stays on the default when localStorage is unavailable", async () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    try {
      const { result } = renderHook(() => useWindSpeedUnit());
      expect(result.current.unit).toBe("kph");

      expect(() => act(() => result.current.toggleUnit())).not.toThrow();
      expect(result.current.unit).toBe("mph");
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });
});
