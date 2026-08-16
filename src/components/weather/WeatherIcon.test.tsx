import { render, screen } from "@testing-library/react";
import { WeatherIcon } from "./WeatherIcon";

describe("WeatherIcon", () => {
  describe("clear sky", () => {
    it("renders Sun icon for clear sky during day (code 0, isDay true)", () => {
      const { container } = render(<WeatherIcon weatherCode={0} isDay={true} />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("lucide-sun");
    });

    it("renders Moon icon for clear sky at night (code 0, isDay false)", () => {
      const { container } = render(<WeatherIcon weatherCode={0} isDay={false} />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("lucide-moon");
    });
  });

  describe("partly cloudy", () => {
    it("renders CloudSun for partly cloudy day (code 2, isDay true)", () => {
      const { container } = render(<WeatherIcon weatherCode={2} isDay={true} />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("lucide-cloud-sun");
    });

    it("renders CloudMoon for partly cloudy night (code 1, isDay false)", () => {
      const { container } = render(<WeatherIcon weatherCode={1} isDay={false} />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("lucide-cloud-moon");
    });
  });

  describe("weather conditions", () => {
    it("renders CloudRain for rain (code 61)", () => {
      const { container } = render(<WeatherIcon weatherCode={61} isDay={true} />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("lucide-cloud-rain");
    });

    it("renders Snowflake for snow (code 71)", () => {
      const { container } = render(<WeatherIcon weatherCode={71} isDay={true} />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("lucide-snowflake");
    });

    it("renders CloudLightning for thunderstorm (code 95)", () => {
      const { container } = render(<WeatherIcon weatherCode={95} isDay={true} />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("lucide-cloud-lightning");
    });

    it("renders CloudFog for fog (code 45)", () => {
      const { container } = render(<WeatherIcon weatherCode={45} isDay={true} />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("lucide-cloud-fog");
    });
  });

  describe("fallback", () => {
    it("renders Cloud as fallback for unknown codes", () => {
      const { container } = render(<WeatherIcon weatherCode={999} isDay={true} />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("lucide-cloud");
    });
  });

  describe("props", () => {
    it("applies className prop", () => {
      const { container } = render(<WeatherIcon weatherCode={0} isDay={true} className="text-yellow-400" />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("text-yellow-400");
    });

    it("has aria-hidden='true' (decorative)", () => {
      const { container } = render(<WeatherIcon weatherCode={0} isDay={true} />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });
});
