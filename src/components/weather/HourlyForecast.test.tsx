import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HourlyForecast } from "./HourlyForecast";
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
  hourly: {
    time: [
      "2026-08-13T10:00",
      "2026-08-13T11:00",
      "2026-08-13T12:00",
      "2026-08-13T13:00",
      "2026-08-13T14:00",
      "2026-08-13T15:00",
      "2026-08-13T16:00",
      "2026-08-13T17:00",
      "2026-08-13T18:00",
      "2026-08-13T19:00",
      "2026-08-13T20:00",
      "2026-08-13T21:00",
    ],
    temperature_2m: [18.5, 19.2, 20.1, 21.0, 21.4, 22.0, 20.2, 19.0, 18.0, 17.2, 16.5, 15.9],
    weathercode: [2, 2, 1, 1, 0, 0, 1, 2, 3, 3, 2, 1],
    is_day: [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
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
  useReducedMotion: () => false,
}));

describe("HourlyForecast", () => {
  describe("empty state", () => {
    it("renders nothing when weather is null and not loading", () => {
      const { container } = render(<HourlyForecast weather={null} isLoading={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("collapsed state", () => {
    it("collapses the forecast by default", () => {
      render(<HourlyForecast weather={mockWeather} isLoading={false} />);
      expect(screen.queryByTestId("hour-item")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /hourly forecast/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /hourly forecast/i })).toHaveAttribute(
        "aria-expanded",
        "false"
      );
    });

    it("omits the card entirely when hourly data is missing", () => {
      const weather = {
        ...mockWeather,
        hourly: undefined,
      };
      const { container } = render(<HourlyForecast weather={weather} isLoading={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("expanded state", () => {
    it("expands to show all 12 hourly entries when the header is clicked", async () => {
      const user = userEvent.setup();
      render(<HourlyForecast weather={mockWeather} isLoading={false} />);

      const toggle = screen.getByRole("button", { name: /hourly forecast/i });
      await user.click(toggle);

      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(screen.getAllByTestId("hour-item")).toHaveLength(12);
    });

    it("labels the first hour 'Now' and subsequent hours with local times", async () => {
      const user = userEvent.setup();
      render(<HourlyForecast weather={mockWeather} isLoading={false} />);

      await user.click(screen.getByRole("button", { name: /hourly forecast/i }));

      const items = screen.getAllByTestId("hour-item");
      expect(within(items[0]).getByText("Now")).toBeInTheDocument();
      expect(within(items[1]).getByText("11:00")).toBeInTheDocument();
      expect(within(items[11]).getByText("21:00")).toBeInTheDocument();
    });

    it("shows hourly temperatures with degree symbol", async () => {
      const user = userEvent.setup();
      render(<HourlyForecast weather={mockWeather} isLoading={false} />);

      await user.click(screen.getByRole("button", { name: /hourly forecast/i }));

      const items = screen.getAllByTestId("hour-item");
      expect(within(items[0]).getByText("18.5°")).toBeInTheDocument();
      expect(within(items[5]).getByText("22°")).toBeInTheDocument();
    });

    it("renders a weather icon per hour", async () => {
      const user = userEvent.setup();
      const { container } = render(<HourlyForecast weather={mockWeather} isLoading={false} />);

      await user.click(screen.getByRole("button", { name: /hourly forecast/i }));

      expect(container.querySelectorAll("svg.lucide")).toHaveLength(13); // 12 hours + chevron
    });

    it("collapses again when the header is clicked a second time", async () => {
      const user = userEvent.setup();
      render(<HourlyForecast weather={mockWeather} isLoading={false} />);

      const toggle = screen.getByRole("button", { name: /hourly forecast/i });
      await user.click(toggle);
      expect(screen.getAllByTestId("hour-item")).toHaveLength(12);

      await user.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByTestId("hour-item")).not.toBeInTheDocument();
    });

    it("shows a skeleton strip while loading and expanded", async () => {
      const user = userEvent.setup();
      render(<HourlyForecast weather={null} isLoading={true} />);

      await user.click(screen.getByRole("button", { name: /hourly forecast/i }));

      expect(screen.getByTestId("hourly-strip-skeleton")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has aria-live='polite' for screen reader updates", () => {
      render(<HourlyForecast weather={mockWeather} isLoading={false} />);
      const liveRegion = screen.getByRole("region");
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
    });

    it("has an appropriate aria-label", () => {
      render(<HourlyForecast weather={mockWeather} isLoading={false} />);
      expect(screen.getByLabelText("Hourly forecast")).toBeInTheDocument();
    });

    it("links the toggle to the strip via aria-controls", async () => {
      const user = userEvent.setup();
      render(<HourlyForecast weather={mockWeather} isLoading={false} />);

      const toggle = screen.getByRole("button", { name: /hourly forecast/i });
      const stripId = toggle.getAttribute("aria-controls");
      expect(stripId).toBeTruthy();

      await user.click(toggle);
      expect(document.getElementById(stripId!)).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("applies glassmorphism styling (check for backdrop-blur class)", () => {
      render(<HourlyForecast weather={mockWeather} isLoading={false} />);
      const card = screen.getByRole("region").querySelector("[data-slot='card']");
      expect(card).toHaveClass("backdrop-blur-xl");
    });

    it("renders a horizontally scrollable container when expanded", async () => {
      const user = userEvent.setup();
      render(<HourlyForecast weather={mockWeather} isLoading={false} />);

      await user.click(screen.getByRole("button", { name: /hourly forecast/i }));

      const container = screen.getByTestId("hourly-scroll-container");
      expect(container).toHaveClass("overflow-x-auto");
    });
  });
});
