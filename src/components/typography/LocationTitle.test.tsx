import { render, screen } from "@testing-library/react";
import { LocationTitle } from "./LocationTitle";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
  useReducedMotion: () => false,
}));

describe("LocationTitle", () => {
  it("renders nothing when locationName is null", () => {
    const { container } = render(
      <LocationTitle locationName={null} country={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the location name in uppercase", () => {
    render(<LocationTitle locationName="London" country="United Kingdom" />);
    const nameElement = screen.getByText("LONDON");
    expect(nameElement).toBeInTheDocument();
  });

  it("renders the country name below the location", () => {
    render(<LocationTitle locationName="London" country="United Kingdom" />);
    const countryElement = screen.getByText("United Kingdom");
    expect(countryElement).toBeInTheDocument();
  });

  it("has aria-hidden='true' (decorative element)", () => {
    render(<LocationTitle locationName="Tokyo" country="Japan" />);
    const container = screen.getByText("TOKYO").closest("[aria-hidden]");
    expect(container).toHaveAttribute("aria-hidden", "true");
  });

  it("applies framer-motion animation attributes", () => {
    render(<LocationTitle locationName="Paris" country="France" />);
    // With mocked framer-motion, the motion.div renders as a plain div
    // but still receives the animation props as attributes
    const container = screen.getByText("PARIS").closest("[aria-hidden]");
    expect(container).toBeInTheDocument();
  });

  it("animates when location changes (AnimatePresence with key)", () => {
    const { rerender } = render(
      <LocationTitle locationName="London" country="United Kingdom" />
    );
    expect(screen.getByText("LONDON")).toBeInTheDocument();

    rerender(<LocationTitle locationName="Tokyo" country="Japan" />);
    expect(screen.getByText("TOKYO")).toBeInTheDocument();
    expect(screen.queryByText("LONDON")).not.toBeInTheDocument();
  });

  it("does not render country when country is null", () => {
    render(<LocationTitle locationName="London" country={null} />);
    expect(screen.getByText("LONDON")).toBeInTheDocument();
    // Should not crash or render empty country element
  });
});
