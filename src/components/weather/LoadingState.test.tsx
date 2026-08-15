import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LoadingState } from "./LoadingState";

describe("LoadingState", () => {
  it("renders a loading message", () => {
    render(<LoadingState isDay />);
    expect(screen.getByTestId("loading-state")).toBeInTheDocument();
    expect(screen.getByText(/Loading weather/i)).toBeInTheDocument();
  });
});
