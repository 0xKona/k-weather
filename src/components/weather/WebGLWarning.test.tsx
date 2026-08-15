import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { WebGLWarning } from "./WebGLWarning";

describe("WebGLWarning", () => {
  it("renders nothing when not shown", () => {
    const { container } = render(<WebGLWarning shown={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the warning message when shown", () => {
    render(<WebGLWarning shown />);
    expect(screen.getByTestId("webgl-warning")).toBeInTheDocument();
    expect(screen.getByText(/WebGL isn't supported/i)).toBeInTheDocument();
  });

  it("dismisses the warning when the close button is clicked", async () => {
    const user = userEvent.setup();
    render(<WebGLWarning shown />);
    expect(screen.getByTestId("webgl-warning")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /dismiss webgl warning/i }));
    expect(screen.queryByTestId("webgl-warning")).not.toBeInTheDocument();
  });
});
