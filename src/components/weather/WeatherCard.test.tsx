import { render, screen } from "@testing-library/react";
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
      expect(card).toHaveClass("backdrop-blur-lg");
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
