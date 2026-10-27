// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HardHat } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BigButton } from "@/components/BigButton";
import { LangSwitch } from "@/components/LangSwitch";
import { StatusBadge } from "@/components/StatusBadge";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

afterEach(cleanup);

describe("BigButton", () => {
  it("exposes its visible label as the accessible name, with the icon hidden", () => {
    render(<BigButton icon={<HardHat />} label="Start work" sublabel="Scan QR" />);
    const btn = screen.getByRole("button", { name: /start work/i });
    expect(btn).toBeInTheDocument();
    expect(btn.querySelector("svg")?.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("renders as a link when given href", () => {
    render(<BigButton href="/w/pay" icon={<HardHat />} label="My pay" />);
    expect(screen.getByRole("link", { name: "My pay" })).toHaveAttribute("href", "/w/pay");
  });
});

describe("LangSwitch", () => {
  it("changes <html lang>, persists the cookie and marks the pressed language", () => {
    render(<LangSwitch current="en" label="Language" />);
    fireEvent.click(screen.getByRole("button", { name: "தமிழ்" }));
    expect(document.documentElement.lang).toBe("ta-IN");
    expect(document.cookie).toContain("fs_lang=ta");
    expect(screen.getByRole("button", { name: "தமிழ்" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "false");
    expect(refresh).toHaveBeenCalled();
  });

  it("is a labelled group", () => {
    render(<LangSwitch current="hi" label="Language" />);
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
  });
});

describe("StatusBadge", () => {
  it("shows a text label, not colour alone", () => {
    render(<StatusBadge status="in_review" label="Being checked" />);
    expect(screen.getByText("Being checked")).toBeVisible();
  });
});
