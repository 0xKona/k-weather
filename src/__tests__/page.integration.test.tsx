import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, afterAll, afterEach, describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/__tests__/mocks/server";
import { isWebGLAvailable } from "@/lib/webgl";
import React from "react";

// Mock GlobeScene — jsdom cannot run WebGL
vi.mock("@/components/globe", () => ({
  GlobeScene: ({ targetLat, targetLng }: { targetLat?: number | null; targetLng?: number | null }) => (
    <div data-testid="globe-scene" data-lat={targetLat} data-lng={targetLng} />
  ),
}));

// Mock framer-motion so animations resolve instantly in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLDivElement>) => (
      <div ref={ref} {...filterMotionProps(props)}>{children}</div>
    )),
    ul: React.forwardRef(({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLUListElement>) => (
      <ul ref={ref} {...filterMotionProps(props)}>{children}</ul>
    )),
    li: React.forwardRef(({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLLIElement>) => (
      <li ref={ref} {...filterMotionProps(props)}>{children}</li>
    )),
    p: React.forwardRef(({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLParagraphElement>) => (
      <p ref={ref} {...filterMotionProps(props)}>{children}</p>
    )),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => true,
}));

// Strip framer-motion-specific props that aren't valid HTML attributes
function filterMotionProps(props: Record<string, unknown>) {
  const motionKeys = [
    "initial", "animate", "exit", "transition", "variants",
    "whileHover", "whileTap", "whileFocus", "whileDrag",
    "layout", "layoutId", "onAnimationComplete",
  ];
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!motionKeys.includes(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

// Mock sonner toast for assertion
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
  Toaster: () => null,
}));

// Mock the WebGL probe — controls whether the page renders the
// "WebGL not supported" warning
vi.mock("@/lib/webgl", () => ({
  isWebGLAvailable: vi.fn(),
}));
const mockIsWebGLAvailable = vi.mocked(isWebGLAvailable);

// Mock navigator.geolocation — jsdom does not provide it
type GeolocationMock = {
  getCurrentPosition: ReturnType<typeof vi.fn>;
  clearWatch: ReturnType<typeof vi.fn>;
  watchPosition: ReturnType<typeof vi.fn>;
};
let geolocationMock: GeolocationMock | undefined;
function stubGeolocation() {
  geolocationMock = {
    getCurrentPosition: vi.fn(),
    clearWatch: vi.fn(),
    watchPosition: vi.fn(),
  };
  Object.defineProperty(navigator, "geolocation", {
    value: geolocationMock,
    configurable: true,
  });
  return geolocationMock;
}
function unstubGeolocation() {
  geolocationMock = undefined;
  Object.defineProperty(navigator, "geolocation", {
    value: undefined,
    configurable: true,
  });
}

import Home from "@/app/page";

beforeAll(() => server.listen());
beforeEach(() => {
  mockIsWebGLAvailable.mockReturnValue(true);
});
afterEach(() => {
  server.resetHandlers();
  mockToastError.mockClear();
  mockToastSuccess.mockClear();
  if (geolocationMock) {
    unstubGeolocation();
  }
});
afterAll(() => server.close());

describe("Home page integration", () => {
  it("renders the search input with combobox role", () => {
    render(<Home />);
    const searchInput = screen.getByRole("combobox");
    expect(searchInput).toBeInTheDocument();
  });

  it("renders the globe scene", () => {
    render(<Home />);
    expect(screen.getByTestId("globe-scene")).toBeInTheDocument();
  });

  it("shows the London default and never auto-requests geolocation on load", async () => {
    render(<Home />);
    // No URL params and no geolocation request — London is the silent default.
    // Geolocation must NOT be prompted automatically.
    expect(screen.getByText("LONDON")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("region", { name: /weather/i })).toBeInTheDocument();
    });
    expect(navigator.geolocation).toBeUndefined();
  });

  it("shows the loading placeholder until weather data arrives", async () => {
    render(<Home />);

    expect(screen.getByTestId("loading-state")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("region", { name: /weather/i })).toBeInTheDocument();
    });
    expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
  });

  it("shows the WebGL warning when WebGL is unavailable", async () => {
    mockIsWebGLAvailable.mockReturnValue(false);
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByTestId("webgl-warning")).toBeInTheDocument();
    });
  });

  it("does not show the WebGL warning when WebGL is available", async () => {
    render(<Home />);

    expect(screen.queryByTestId("webgl-warning")).not.toBeInTheDocument();
  });

  it("selects the current location when 'Use my location' is clicked", async () => {
    const geo = stubGeolocation();
    geo.getCurrentPosition.mockImplementation((success: (position: GeolocationPosition) => void) => {
      success({
        coords: {
          latitude: 51.5074,
          longitude: -0.1278,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      });
    });

    const user = userEvent.setup();
    render(<Home />);

    const locateButton = screen.getByRole("button", { name: /use my location/i });
    await user.click(locateButton);

    // Reverse-geocoded "Testville" becomes the selected location
    await waitFor(() => {
      expect(screen.getByText("TESTVILLE")).toBeInTheDocument();
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("Showing weather for Testville");
  });

  it("shows an error toast when location access is denied", async () => {
    const geo = stubGeolocation();
    geo.getCurrentPosition.mockImplementation(
      (_success: (position: GeolocationPosition) => void, error: (err: GeolocationPositionError) => void) => {
        error({
          code: 1,
          message: "denied",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      }
    );

    const user = userEvent.setup();
    render(<Home />);

    const locateButton = screen.getByRole("button", { name: /use my location/i });
    await user.click(locateButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Location access was denied or unavailable. Check your browser's permission settings and try again."
      );
    });
  });

  it("shows suggestions when user types a location", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const input = screen.getByRole("combobox");
    await user.type(input, "London");

    // The panel opens instantly as a skeleton — wait for the actual results
    await waitFor(() => {
      expect(screen.getByRole("option")).toBeInTheDocument();
    });

    // Scope to the listbox — LocationTitle may also show "United Kingdom"
    // from the initial London fallback
    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByText("London")).toBeInTheDocument();
    expect(within(listbox).getByText("United Kingdom")).toBeInTheDocument();
  });

  it("selects a location and shows title and weather data", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const input = screen.getByRole("combobox");
    await user.type(input, "London");

    // The panel opens instantly as a skeleton — wait for the actual results
    await waitFor(() => {
      expect(screen.getByRole("option")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("option"));

    // LocationTitle should appear with uppercase name
    await waitFor(() => {
      expect(screen.getByText("LONDON")).toBeInTheDocument();
    });

    // WeatherCard should appear with temperature from MSW handler
    await waitFor(() => {
      expect(screen.getByText(/18.5°C/)).toBeInTheDocument();
    });
  });

  it("passes coordinates to GlobeScene when location is selected", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const input = screen.getByRole("combobox");
    await user.type(input, "London");

    // The panel opens instantly as a skeleton — wait for the actual results
    await waitFor(() => {
      expect(screen.getByRole("option")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("option"));

    await waitFor(() => {
      const globe = screen.getByTestId("globe-scene");
      expect(globe).toHaveAttribute("data-lat", "51.5085");
      expect(globe).toHaveAttribute("data-lng", "-0.1257");
    });
  });

  it("shows toast on weather fetch error", async () => {
    server.use(
      http.get("https://api.open-meteo.com/v1/forecast", () =>
        HttpResponse.json({ error: true }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    render(<Home />);

    const input = screen.getByRole("combobox");
    await user.type(input, "London");

    // The panel opens instantly as a skeleton — wait for the actual results
    await waitFor(() => {
      expect(screen.getByRole("option")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("option"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Unable to fetch weather data. Please try again."
      );
    });
  });
});
