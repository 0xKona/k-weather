import { render, screen } from "@testing-library/react";
import { LocalTime } from "./LocalTime";

vi.mock("framer-motion", () => ({
  motion: {
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => children,
  useReducedMotion: () => false,
}));

describe("LocalTime", () => {
  it("renders nothing when localTime is null", () => {
    const { container } = render(<LocalTime localTime={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the formatted local time with a label", () => {
    render(<LocalTime localTime="2026-08-15T12:30" />);
    expect(screen.getByText("Local Time: 12:30")).toBeInTheDocument();
  });

  it("has aria-hidden='true' (decorative element)", () => {
    render(<LocalTime localTime="2026-08-15T12:30" />);
    const element = screen.getByText("Local Time: 12:30");
    expect(element).toHaveAttribute("aria-hidden", "true");
  });
});
