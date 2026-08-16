import { renderHook, waitFor } from "@testing-library/react";
import { act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useTemperatureUnit } from "./useTemperatureUnit";
import { TEMPERATURE_UNIT_STORAGE_KEY } from "@/lib/temperature";

describe("useTemperatureUnit", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("defaults to celsius when nothing is stored", async () => {
    const { result } = renderHook(() => useTemperatureUnit());
    expect(result.current.unit).toBe("celsius");
  });

  it("applies a saved fahrenheit preference after mount", async () => {
    window.localStorage.setItem(TEMPERATURE_UNIT_STORAGE_KEY, "fahrenheit");
    const { result } = renderHook(() => useTemperatureUnit());
    await waitFor(() => expect(result.current.unit).toBe("fahrenheit"));
  });

  it("ignores an invalid stored value", async () => {
    window.localStorage.setItem(TEMPERATURE_UNIT_STORAGE_KEY, "kelvin");
    const { result } = renderHook(() => useTemperatureUnit());
    expect(result.current.unit).toBe("celsius");
  });

  it("toggles the unit and persists it", async () => {
    const { result } = renderHook(() => useTemperatureUnit());
    expect(result.current.unit).toBe("celsius");

    act(() => result.current.toggleUnit());
    expect(result.current.unit).toBe("fahrenheit");
    expect(window.localStorage.getItem(TEMPERATURE_UNIT_STORAGE_KEY)).toBe("fahrenheit");

    act(() => result.current.toggleUnit());
    expect(result.current.unit).toBe("celsius");
    expect(window.localStorage.getItem(TEMPERATURE_UNIT_STORAGE_KEY)).toBe("celsius");
  });

  it("stays on the default when localStorage is unavailable", async () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    try {
      const { result } = renderHook(() => useTemperatureUnit());
      expect(result.current.unit).toBe("celsius");

      expect(() => act(() => result.current.toggleUnit())).not.toThrow();
      expect(result.current.unit).toBe("fahrenheit");
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });
});
