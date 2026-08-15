import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GlobeScene } from "./GlobeScene";

vi.mock("@react-three/fiber", () => ({
  Canvas: () => <div data-testid="canvas" />,
  useFrame: () => {},
}));

vi.mock("@react-three/drei", () => ({
  Preload: () => null,
}));

vi.mock("./Globe", () => ({
  Globe: () => null,
}));

vi.mock("./CountryOutline", () => ({
  CountryOutline: () => null,
}));

describe("GlobeScene", () => {
  it("renders the fallback (and never the Canvas) when WebGL is unavailable", () => {
    render(<GlobeScene webglAvailable={false} />);

    expect(screen.getByTestId("globe-fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("canvas")).not.toBeInTheDocument();
  });

  it("renders the fallback while the probe has not run (null)", () => {
    render(<GlobeScene webglAvailable={null} />);

    expect(screen.getByTestId("globe-fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("canvas")).not.toBeInTheDocument();
  });

  it("renders the Canvas when WebGL is available", () => {
    render(<GlobeScene webglAvailable />);

    expect(screen.getByTestId("canvas")).toBeInTheDocument();
    expect(screen.queryByTestId("globe-fallback")).not.toBeInTheDocument();
  });
});
