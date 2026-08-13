import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationSuggestions } from "./LocationSuggestions";
import type { GeocodingResult } from "@/types";

const mockSuggestions: GeocodingResult[] = [
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
  {
    id: 4517009,
    name: "London",
    latitude: 39.8865,
    longitude: -83.4483,
    country: "United States",
    timezone: "America/New_York",
    admin1: "Ohio",
  },
];

describe("LocationSuggestions", () => {
  const defaultProps = {
    suggestions: mockSuggestions,
    isLoading: false,
    activeIndex: -1,
    onSelect: vi.fn(),
    listboxId: "location-suggestions",
  };

  it("renders nothing when suggestions is empty and not loading", () => {
    const { container } = render(
      <LocationSuggestions {...defaultProps} suggestions={[]} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders loading state when isLoading is true", () => {
    render(
      <LocationSuggestions
        {...defaultProps}
        suggestions={[]}
        isLoading={true}
      />
    );
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();
    // Should show 3 skeleton pulse items
    const skeletons = listbox.querySelectorAll("[data-testid='skeleton-item']");
    expect(skeletons).toHaveLength(3);
  });

  it("renders list of suggestions with name, admin1 and country", () => {
    render(<LocationSuggestions {...defaultProps} />);
    // All three are named "London" — check they all render
    expect(screen.getAllByText("London")).toHaveLength(3);
    expect(screen.getByText(/England, United Kingdom/)).toBeInTheDocument();
    expect(screen.getByText(/Ontario, Canada/)).toBeInTheDocument();
    expect(screen.getByText(/Ohio, United States/)).toBeInTheDocument();
  });

  it("highlights the active suggestion based on activeIndex", () => {
    render(<LocationSuggestions {...defaultProps} activeIndex={1} />);
    const options = screen.getAllByRole("option");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(options[0]).toHaveAttribute("aria-selected", "false");
    expect(options[2]).toHaveAttribute("aria-selected", "false");
  });

  it("calls onSelect when a suggestion is clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<LocationSuggestions {...defaultProps} onSelect={onSelect} />);

    const options = screen.getAllByRole("option");
    await user.click(options[0]);

    expect(onSelect).toHaveBeenCalledWith(mockSuggestions[0]);
  });

  it("each item has role='option' and correct id pattern", () => {
    render(<LocationSuggestions {...defaultProps} />);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveAttribute(
      "id",
      "location-suggestions-option-0"
    );
    expect(options[1]).toHaveAttribute(
      "id",
      "location-suggestions-option-1"
    );
    expect(options[2]).toHaveAttribute(
      "id",
      "location-suggestions-option-2"
    );
  });

  it("the container has role='listbox'", () => {
    render(<LocationSuggestions {...defaultProps} />);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
});
