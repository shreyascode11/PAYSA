// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HardHat, Inbox, Truck } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LangSwitch } from "@/components/LangSwitch";
import { StatusBadge } from "@/components/StatusBadge";
import { BigButton } from "@/components/ui/BigButton";
import { DotCalendar } from "@/components/ui/DotCalendar";
import { Gauge } from "@/components/ui/Gauge";
import { PillNav } from "@/components/ui/PillNav";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { Timeline } from "@/components/ui/Timeline";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }), usePathname: () => "/w/pay" }));

afterEach(cleanup);

describe("BigButton", () => {
  it("exposes its visible label as the accessible name, with the icon hidden", () => {
    render(<BigButton icon={<HardHat />} label="Start work" sublabel="Scan QR" />);
    const btn = screen.getByRole("button", { name: /start work/i });
    expect(btn.querySelector("svg")?.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("renders as a link when given href, with orange fill and ink text for primary", () => {
    render(<BigButton href="/w/pay" icon={<HardHat />} label="My pay" />);
    const link = screen.getByRole("link", { name: "My pay" });
    expect(link).toHaveAttribute("href", "/w/pay");
    expect(link.className).toContain("bg-safety-500");
    expect(link.className).toContain("text-ink-900");
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
});

describe("StatusPill / StatusBadge", () => {
  it.each(["ok", "warn", "critical", "info", "neutral"] as const)("%s pill shows an icon and a text label", (tone) => {
    render(<StatusPill tone={tone} label={`State ${tone}`} />);
    const pill = screen.getByText(`State ${tone}`);
    expect(pill).toBeVisible();
    expect(pill.querySelector("svg")).not.toBeNull();
  });

  it("never puts ink text on critical (fails contrast) or orange anywhere", () => {
    render(<StatusPill tone="critical" label="Critical" />);
    const cls = screen.getByText("Critical").className;
    expect(cls).toContain("text-cream-50");
    expect(cls).not.toContain("safety-500");
  });

  it("report status badge keeps its label", () => {
    render(<StatusBadge status="in_review" label="Being checked" />);
    expect(screen.getByText("Being checked")).toBeVisible();
  });
});

describe("PillNav", () => {
  it("marks the current tab and labels every icon", () => {
    render(
      <PillNav
        label="Main menu"
        items={[
          { href: "/w/home", label: "Home", icon: "home" },
          { href: "/w/pay", label: "Pay", icon: "pay" },
          { href: "/w/report", label: "Report", icon: "report" },
          { href: "/w/passport", label: "Skills", icon: "passport" },
        ]}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Main menu" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pay" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });
});

describe("StatCard", () => {
  it("shows label, value and unit", () => {
    render(<StatCard label="Overtime" value="3.5" unit="h" />);
    expect(screen.getByText("Overtime")).toBeVisible();
    expect(screen.getByText("3.5")).toBeVisible();
    expect(screen.getByText("h")).toBeVisible();
  });
});

describe("Timeline", () => {
  it("announces the current step and progress", () => {
    render(
      <Timeline
        current={1}
        nowLabel="Now"
        progressLabel="Step 2 of 3"
        steps={[
          { key: "a", label: "Received", Icon: Inbox },
          { key: "b", label: "Checking", Icon: Truck },
          { key: "c", label: "Solved", Icon: Inbox },
        ]}
      />,
    );
    expect(screen.getByText("Checking").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "Step 2 of 3");
    expect(screen.getByText("Now")).toBeVisible();
  });
});

describe("DotCalendar", () => {
  const rows = [{ key: "w1", label: "20 Oct", dots: [{ key: "d1", state: "worked" as const, label: "20 Oct: worked" }, { key: "d2", state: "off" as const, label: "21 Oct: day off" }] }];

  it("gives every dot an accessible name and the grid a caption", () => {
    render(<DotCalendar rows={rows} caption="2 days worked" />);
    expect(screen.getByRole("table", { name: "2 days worked" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "20 Oct: worked" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "21 Oct: day off" })).toBeInTheDocument();
  });

  it("becomes buttons when selectable", () => {
    const onSelect = vi.fn();
    render(<DotCalendar rows={rows} caption="grid" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "21 Oct: day off" }));
    expect(onSelect).toHaveBeenCalledWith("w1", "d2");
  });
});

describe("Gauge", () => {
  it("describes value and band in text, not colour", () => {
    render(<Gauge value={65} label="Quit risk" bandLabel="High" band="critical" />);
    expect(screen.getByRole("img", { name: "Quit risk: 65 of 100, High" })).toBeInTheDocument();
    expect(screen.getByText("High")).toBeVisible();
  });
});

describe("IdBadge", () => {
  it("renders the role chip, content and footer", async () => {
    const { IdBadge } = await import("@/components/ui/IdBadge");
    render(
      <IdBadge kind="Worker pass" footer={<span>Secure</span>}>
        <h1>WORKER</h1>
      </IdBadge>,
    );
    expect(screen.getByText("Worker pass")).toBeVisible();
    expect(screen.getByRole("heading", { name: "WORKER" })).toBeInTheDocument();
    expect(screen.getByText("Secure")).toBeVisible();
  });
});

describe("ColumnChart", () => {
  it("names every column, shows a legend for 2+ series and offers a table", async () => {
    const { ColumnChart } = await import("@/components/ui/ColumnChart");
    render(
      <ColumnChart
        title="Hours"
        format={(v) => `${v}h`}
        series={[
          { key: "r", label: "Regular", fill: "bg-forest-700" },
          { key: "o", label: "Overtime", fill: "bg-safety-500" },
        ]}
        columns={[
          { key: "w1", label: "6 Oct", values: { r: 40, o: 5 } },
          { key: "w2", label: "13 Oct", values: { r: 44, o: 9 } },
        ]}
      />,
    );
    expect(screen.getByLabelText("13 Oct: Regular 44h, Overtime 9h")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Legend" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Hours" })).toBeInTheDocument();
  });
});
