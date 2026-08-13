import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationSearch } from "./LocationSearch";
import type { GeocodingResult } from "@/types";

// Mock the geocoding service directly to avoid MSW + fake timer conflicts
vi.mock("@/services/geocodingApi", () => ({
  searchLocations: vi.fn(),
}));

import { searchLocations } from "@/services/geocodingApi";

const mockSearchLocations = vi.mocked(searchLocations);

const mockResults: GeocodingResult[] = [
  {
    id: 2643743,
    name: "London",
    latitude: 51.5085,
    longitude: -0.1257,
    country: "United Kingdom",
    timezone: "Europe/London",
    admin1: "England",
  },
  {
    id: 6058560,
    name: "London",
    latitude: 42.9834,
    longitude: -81.2497,
    country: "Canada",
    timezone: "America/Toronto",
    admin1: "Ontario",
  },
];

describe("LocationSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockSearchLocations.mockResolvedValue(mockResults);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  const defaultProps = {
    onLocationSelect: vi.fn(),
  };

  // Helper to type and trigger debounce
  async function typeAndDebounce(
    user: ReturnType<typeof userEvent.setup>,
    input: HTMLElement,
    text: string
  ) {
    await user.type(input, text);
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    // Let the mocked promise resolve
    await act(async () => {
      await Promise.resolve();
    });
  }

  it("renders search input with correct ARIA attributes", () => {
    render(<LocationSearch {...defaultProps} />);
    const input = screen.getByRole("combobox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveAttribute("aria-controls", "location-suggestions");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
  });

  it("updates input value on change", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    render(<LocationSearch {...defaultProps} />);
    const input = screen.getByRole("combobox");

    await user.type(input, "Lon");

    expect(input).toHaveValue("Lon");
  });

  it("shows suggestions after typing", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    render(<LocationSearch {...defaultProps} />);
    const input = screen.getByRole("combobox");

    await typeAndDebounce(user, input, "London");

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("calls onLocationSelect when suggestion is selected", async () => {
    const onLocationSelect = vi.fn();
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    render(<LocationSearch onLocationSelect={onLocationSelect} />);
    const input = screen.getByRole("combobox");

    await typeAndDebounce(user, input, "London");

    const options = screen.getAllByRole("option");
    await user.click(options[0]);

    expect(onLocationSelect).toHaveBeenCalledWith(mockResults[0]);
  });

  it("navigates suggestions with arrow keys", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    render(<LocationSearch {...defaultProps} />);
    const input = screen.getByRole("combobox");

    await typeAndDebounce(user, input, "London");

    // ArrowDown moves to first option
    await user.keyboard("{ArrowDown}");
    let options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");

    // ArrowDown moves to second option
    await user.keyboard("{ArrowDown}");
    options = screen.getAllByRole("option");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(options[0]).toHaveAttribute("aria-selected", "false");

    // ArrowUp moves back to first option
    await user.keyboard("{ArrowUp}");
    options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(options[1]).toHaveAttribute("aria-selected", "false");
  });

  it("selects active suggestion on Enter", async () => {
    const onLocationSelect = vi.fn();
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    render(<LocationSearch onLocationSelect={onLocationSelect} />);
    const input = screen.getByRole("combobox");

    await typeAndDebounce(user, input, "London");

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onLocationSelect).toHaveBeenCalledWith(mockResults[0]);
  });

  it("Enter submits first suggestion when none is actively selected", async () => {
    const onLocationSelect = vi.fn();
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    render(<LocationSearch onLocationSelect={onLocationSelect} />);
    const input = screen.getByRole("combobox");

    await typeAndDebounce(user, input, "London");

    // No ArrowDown — press Enter directly
    await user.keyboard("{Enter}");

    expect(onLocationSelect).toHaveBeenCalledWith(mockResults[0]);
  });

  it("renders a submit button that selects first suggestion on click", async () => {
    const onLocationSelect = vi.fn();
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    render(<LocationSearch onLocationSelect={onLocationSelect} />);
    const input = screen.getByRole("combobox");

    await typeAndDebounce(user, input, "London");

    const submitButton = screen.getByRole("button", { name: /submit search/i });
    await user.click(submitButton);

    expect(onLocationSelect).toHaveBeenCalledWith(mockResults[0]);
  });

  it("closes suggestions on Escape", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    render(<LocationSearch {...defaultProps} />);
    const input = screen.getByRole("combobox");

    await typeAndDebounce(user, input, "London");

    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("has aria-activedescendant pointing to active option", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    render(<LocationSearch {...defaultProps} />);
    const input = screen.getByRole("combobox");

    await typeAndDebounce(user, input, "London");

    // No active descendant initially
    expect(input).toHaveAttribute("aria-activedescendant", "");

    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      "location-suggestions-option-0"
    );

    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      "location-suggestions-option-1"
    );
  });

  it("clears suggestions when input is cleared", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    render(<LocationSearch {...defaultProps} />);
    const input = screen.getByRole("combobox");

    await typeAndDebounce(user, input, "London");

    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.clear(input);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
