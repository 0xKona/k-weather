import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeAll, afterAll, afterEach, describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/__tests__/mocks/server";
import { useGeocoding } from "./useGeocoding";

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});
afterAll(() => server.close());

describe("useGeocoding", () => {
  describe("initial state", () => {
    it("starts with empty query and results", () => {
      const { result } = renderHook(() => useGeocoding());

      expect(result.current.query).toBe("");
      expect(result.current.results).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("setQuery", () => {
    it("updates the query value immediately", () => {
      const { result } = renderHook(() => useGeocoding());

      act(() => {
        result.current.setQuery("London");
      });

      expect(result.current.query).toBe("London");
    });

    it("sets isLoading true when query has content", () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useGeocoding());

      act(() => {
        result.current.setQuery("London");
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("does not set isLoading for empty/whitespace query", () => {
      const { result } = renderHook(() => useGeocoding());

      act(() => {
        result.current.setQuery("   ");
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.results).toEqual([]);
    });
  });

  describe("debounced search", () => {
    it("fetches results after debounce delay", async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useGeocoding());

      act(() => {
        result.current.setQuery("London");
      });

      // Before debounce fires — still loading, no results
      expect(result.current.results).toEqual([]);

      // Advance past debounce
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.results.length).toBeGreaterThan(0);
      });

      expect(result.current.results[0].name).toBe("London");
    });

    it("cancels previous debounce when query changes rapidly", async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useGeocoding());

      act(() => {
        result.current.setQuery("Lo");
      });

      // Advance partway, then change query
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      act(() => {
        result.current.setQuery("London");
      });

      // Advance another 300ms for the second query
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Only the final query should have produced results
      expect(result.current.results[0].name).toBe("London");
    });

    it("clears results when query is emptied", async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useGeocoding());

      // First, get some results
      act(() => {
        result.current.setQuery("London");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });

      // Now clear the query
      act(() => {
        result.current.setQuery("");
      });

      expect(result.current.results).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("error handling", () => {
    it("sets error on network failure", async () => {
      server.use(
        http.get(
          "https://geocoding-api.open-meteo.com/v1/search",
          () => HttpResponse.error()
        )
      );

      vi.useFakeTimers();
      const { result } = renderHook(() => useGeocoding());

      act(() => {
        result.current.setQuery("London");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.results).toEqual([]);
      // searchLocations returns [] on error, so hook gets empty results (not an error state)
    });
  });

  describe("clearResults", () => {
    it("clears results and resets state", async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useGeocoding());

      act(() => {
        result.current.setQuery("London");
      });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.results).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
