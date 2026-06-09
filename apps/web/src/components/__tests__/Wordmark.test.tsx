import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { Wordmark } from "../Wordmark";

describe("Wordmark", () => {
  it("renders the badge as an accessible inline svg named 8BU", () => {
    const { getByRole } = render(<Wordmark />);
    const svg = getByRole("img", { name: "8BU" });
    expect(svg.tagName.toLowerCase()).toBe("svg");
  });

  it("renders a blinking caret path target", () => {
    const { container } = render(<Wordmark />);
    expect(container.querySelector("path.wm-blink-caret")).not.toBeNull();
  });

  it("keeps the name as live selectable text", () => {
    const { getByText } = render(<Wordmark />);
    expect(getByText("Long NGUYỄN")).toBeInTheDocument();
  });

  it("renders the subtitle when provided and omits it when null", () => {
    const { queryByText, rerender } = render(<Wordmark sub="Senior Web Developer" />);
    expect(queryByText(/Senior Web Developer/)).toBeInTheDocument();
    rerender(<Wordmark sub={null} />);
    expect(queryByText(/Senior Web Developer/)).toBeNull();
  });
});
