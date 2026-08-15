import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useWebGLSupport } from "./useWebGLSupport";
import { isWebGLAvailable } from "@/lib/webgl";

vi.mock("@/lib/webgl", () => ({
  isWebGLAvailable: vi.fn(),
}));

const mockIsWebGLAvailable = vi.mocked(isWebGLAvailable);

describe("useWebGLSupport", () => {
  beforeEach(() => {
    mockIsWebGLAvailable.mockReset();
  });

  it("returns true when WebGL is available", async () => {
    mockIsWebGLAvailable.mockReturnValue(true);
    const { result } = renderHook(() => useWebGLSupport());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("returns false when WebGL is unavailable", async () => {
    mockIsWebGLAvailable.mockReturnValue(false);
    const { result } = renderHook(() => useWebGLSupport());
    await waitFor(() => expect(result.current).toBe(false));
  });
});
