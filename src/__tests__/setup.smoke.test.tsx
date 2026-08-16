import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { cn } from "@/lib/utils";

describe("Test setup smoke test", () => {
  it("vitest globals and matchers work", () => {
    expect(true).toBe(true);
    expect("hello").toContain("hell");
  });

  it("jsdom environment is available", () => {
    const div = document.createElement("div");
    div.textContent = "Hello";
    expect(div.textContent).toBe("Hello");
  });

  it("path alias @/ resolves correctly", () => {
    // cn() from @/lib/utils should merge classes
    const result = cn("text-white", "bg-black", "text-white");
    expect(result).toBe("bg-black text-white");
  });

  it("React Testing Library renders components", () => {
    function TestComponent() {
      return <p>K-Weather works</p>;
    }

    render(<TestComponent />);
    expect(screen.getByText("K-Weather works")).toBeInTheDocument();
  });

  it("jest-dom matchers are available", () => {
    function TestComponent() {
      return <button disabled>Click me</button>;
    }

    render(<TestComponent />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
