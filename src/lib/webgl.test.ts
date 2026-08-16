import { describe, it, expect, beforeEach, vi } from "vitest";
import { isWebGLAvailable } from "./webgl";

describe("isWebGLAvailable", () => {
  const getContext = vi.fn();

  beforeEach(() => {
    getContext.mockReset();
    Object.defineProperty(globalThis, "document", {
      value: {
        createElement: () => ({ getContext }),
      },
      configurable: true,
    });
  });

  it("returns true when a WebGL2 context can be created", () => {
    getContext.mockReturnValue({});
    expect(isWebGLAvailable()).toBe(true);
    expect(getContext).toHaveBeenCalledWith("webgl2");
  });

  it("returns false when WebGL2 context creation returns null", () => {
    getContext.mockReturnValue(null);
    expect(isWebGLAvailable()).toBe(false);
  });

  it("returns false when getContext throws", () => {
    getContext.mockImplementation(() => {
      throw new Error("context blocked");
    });
    expect(isWebGLAvailable()).toBe(false);
  });

  it("returns false when only WebGL1 is available", () => {
    getContext.mockImplementation((type: string) =>
      type === "webgl2" ? null : {}
    );
    expect(isWebGLAvailable()).toBe(false);
  });

  it("returns false when document is undefined (SSR)", () => {
    Object.defineProperty(globalThis, "document", { value: undefined, configurable: true });
    expect(isWebGLAvailable()).toBe(false);
  });
});
