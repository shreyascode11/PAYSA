"use client";

import { Flame, Inbox, LayoutDashboard, Megaphone, QrCode, TrendingDown, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard },
  { href: "/admin/reports", label: "Reports", Icon: Inbox },
  { href: "/admin/fatigue", label: "Fatigue", Icon: Flame },
  { href: "/admin/attrition", label: "Quit risk", Icon: TrendingDown },
  { href: "/admin/workers", label: "Workers", Icon: Users },
  { href: "/admin/sites", label: "Sites & QR", Icon: QrCode },
  { href: "/admin/notices", label: "Notices", Icon: Megaphone },
] as const;

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/admin" ? path === href : path.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg px-3 font-semibold ${
                  active ? "bg-brand-soft text-brand" : "text-ink hover:bg-surface-2"
                }`}
              >
                <Icon aria-hidden="true" className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
