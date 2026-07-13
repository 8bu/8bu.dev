import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

// Editorial home renders TanStack <Link>s (need router context) and calls
// useNavigate in its Ask-shortcut hook. Stub both: Link → plain anchor,
// useNavigate → noop.
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  };
});

describe("/ route (editorial home)", () => {
  it("renders the editorial scroll sections + Ask entry, not a chat composer", async () => {
    const { Route } = await import("./index");
    const Component = Route.options.component!;
    render(<Component />);

    // Hero name + section headings from the editorial IA (ADR-0001).
    expect(screen.getByText("NGUYỄN")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Selected Work" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Writing" })).toBeInTheDocument();

    // Ask relocated off the homepage: nav links to /chat, no inline composer.
    const ask = screen.getByRole("link", { name: /ASK/ });
    expect(ask).toHaveAttribute("href", "/chat");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("binds Selected Work to the live project catalog (deep-links to artifacts)", async () => {
    const { Route } = await import("./index");
    const Component = Route.options.component!;
    render(<Component />);

    // At least one work row links into a standalone project artifact page.
    const links = screen.getAllByRole("link");
    const caseLinks = links.filter((a) =>
      a.getAttribute("href")?.startsWith("/artifact/projects/"),
    );
    expect(caseLinks.length).toBeGreaterThan(0);
  });
});
