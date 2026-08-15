import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { WeatherCard } from "./WeatherCard";
import type { WeatherResponse } from "@/types";

const mockWeather: WeatherResponse = {
  latitude: 51.5,
  longitude: -0.12,
  current_weather: {
    temperature: 18.5,
    windspeed: 12.3,
    winddirection: 220,
    weathercode: 2,
    is_day: 1,
    time: "2026-08-13T10:00",
  },
  timezone: "Europe/London",
  timezone_abbreviation: "BST",
};

// Mock framer-motion to avoid animation timing issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useReducedMotion: () => false,
}));

describe("WeatherCard", () => {
  describe("empty state", () => {
    it("renders nothing when weather is null and not loading", () => {
      const { container } = render(<WeatherCard weather={null} isLoading={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("loading state", () => {
    it("renders loading skeleton when isLoading is true", () => {
      render(<WeatherCard weather={null} isLoading={true} />);
      expect(screen.getByTestId("weather-card-skeleton")).toBeInTheDocument();
    });
  });

  describe("data display", () => {
    it("displays temperature with degree symbol and unit", () => {
      render(<WeatherCard weather={mockWeather} isLoading={false} />);
      expect(screen.getByText("18.5°C")).toBeInTheDocument();
    });

    it("displays fahrenheit when unit is fahrenheit", () => {
      render(<WeatherCard weather={mockWeather} isLoading={false} unit="fahrenheit" />);
      expect(screen.getByText("65°F")).toBeInTheDocument();
    });

    it("is a clickable button that toggles the unit", async () => {
      const user = userEvent.setup();
      const onToggleUnit = vi.fn();
      render(
        <WeatherCard weather={mockWeather} isLoading={false} onToggleUnit={onToggleUnit} />
      );

      const tempButton = screen.getByRole("button", { name: /switch to fahrenheit/i });
      expect(tempButton).toBeInTheDocument();
      await user.click(tempButton);
      expect(onToggleUnit).toHaveBeenCalledTimes(1);
    });

    it("displays wind speed in mph when unit is mph", () => {
      render(
        <WeatherCard weather={mockWeather} isLoading={false} windSpeedUnit="mph" />
      );
      expect(screen.getByText("8 mph")).toBeInTheDocument();
    });

    it("is a clickable button that toggles the wind speed unit", async () => {
      const user = userEvent.setup();
      const onToggleWindSpeedUnit = vi.fn();
      render(
        <WeatherCard
          weather={mockWeather}
          isLoading={false}
          onToggleWindSpeedUnit={onToggleWindSpeedUnit}
        />
      );

      const windButton = screen.getByRole("button", {
        name: /switch to miles per hour/i,
      });
      expect(windButton).toBeInTheDocument();
      await user.click(windButton);
      expect(onToggleWindSpeedUnit).toHaveBeenCalledTimes(1);
    });

    it("displays wind speed", () => {
      render(<WeatherCard weather={mockWeather} isLoading={false} />);
      expect(screen.getByText(/12.3/)).toBeInTheDocument();
      expect(screen.getByText(/km\/h/)).toBeInTheDocument();
    });

    it("displays weather condition text (mapped from weathercode)", () => {
      render(<WeatherCard weather={mockWeather} isLoading={false} />);
      expect(screen.getByText("Partly cloudy")).toBeInTheDocument();
    });

    it("renders WeatherIcon with correct props", () => {
      const { container } = render(<WeatherCard weather={mockWeather} isLoading={false} />);
      // WeatherIcon renders an SVG with aria-hidden and lucide class
      const icon = container.querySelector("svg.lucide");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("displays sunrise and sunset times when daily data is present", () => {
      const weather = {
        ...mockWeather,
        daily: {
          time: ["2026-08-13"],
          sunrise: ["2026-08-13T05:47"],
          sunset: ["2026-08-13T20:17"],
        },
      };
      render(<WeatherCard weather={weather} isLoading={false} />);
      expect(screen.getByText("05:47")).toBeInTheDocument();
      expect(screen.getByText("20:17")).toBeInTheDocument();
    });

    it("omits sunrise and sunset when daily data is missing", () => {
      render(<WeatherCard weather={mockWeather} isLoading={false} />);
      expect(screen.queryByText(/^\d{2}:\d{2}$/)).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has aria-live='polite' for screen reader updates", () => {
      render(<WeatherCard weather={mockWeather} isLoading={false} />);
      const liveRegion = screen.getByRole("region");
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
    });

    it("has appropriate heading/labelling", () => {
      render(<WeatherCard weather={mockWeather} isLoading={false} />);
      expect(screen.getByLabelText("Current weather")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("applies glassmorphism styling (check for backdrop-blur class)", () => {
      render(<WeatherCard weather={mockWeather} isLoading={false} />);
      const card = screen.getByRole("region").querySelector("[data-slot='card']");
      expect(card).toHaveClass("backdrop-blur-xl");
    });

    it("uses a more opaque day tint when is_day is 1", () => {
      render(<WeatherCard weather={mockWeather} isLoading={false} />);
      const card = screen.getByRole("region").querySelector("[data-slot='card']");
      expect(card).toHaveClass("bg-background/85");
    });

    it("uses a more transparent night tint when is_day is 0", () => {
      const weather = {
        ...mockWeather,
        current_weather: { ...mockWeather.current_weather, is_day: 0 },
      };
      render(<WeatherCard weather={weather} isLoading={false} />);
      const card = screen.getByRole("region").querySelector("[data-slot='card']");
      expect(card).toHaveClass("bg-background/60");
    });
  });

  describe("condition text mapping", () => {
    it("maps code 0 to 'Clear sky'", () => {
      const weather = {
        ...mockWeather,
        current_weather: { ...mockWeather.current_weather, weathercode: 0 },
      };
      render(<WeatherCard weather={weather} isLoading={false} />);
      expect(screen.getByText("Clear sky")).toBeInTheDocument();
    });

    it("maps code 3 to 'Overcast'", () => {
      const weather = {
        ...mockWeather,
        current_weather: { ...mockWeather.current_weather, weathercode: 3 },
      };
      render(<WeatherCard weather={weather} isLoading={false} />);
      expect(screen.getByText("Overcast")).toBeInTheDocument();
    });

    it("maps code 95 to 'Thunderstorm'", () => {
      const weather = {
        ...mockWeather,
        current_weather: { ...mockWeather.current_weather, weathercode: 95 },
      };
      render(<WeatherCard weather={weather} isLoading={false} />);
      expect(screen.getByText("Thunderstorm")).toBeInTheDocument();
    });
  });
});
