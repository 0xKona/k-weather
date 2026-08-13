import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, afterAll, afterEach, describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/__tests__/mocks/server";
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
vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args) },
  Toaster: () => null,
}));

import Home from "@/app/page";

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  mockToastError.mockClear();
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

  it("does not show location title or weather card initially", () => {
    render(<Home />);
    expect(screen.queryByText(/LONDON/)).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /weather/i })).not.toBeInTheDocument();
  });

  it("shows suggestions when user types a location", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const input = screen.getByRole("combobox");
    await user.type(input, "London");

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    expect(screen.getByText("London")).toBeInTheDocument();
    expect(screen.getByText("United Kingdom")).toBeInTheDocument();
  });

  it("selects a location and shows title and weather data", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const input = screen.getByRole("combobox");
    await user.type(input, "London");

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
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

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
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

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("option"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Unable to fetch weather data. Please try again."
      );
    });
  });
});
