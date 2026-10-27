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

/** Sidebar navigation on the navy panel: active item is a sand chip with navy text. */
export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin">
      <p className="mb-2 hidden px-3 text-xs font-bold uppercase tracking-wider text-ivory-50/75 lg:block">Menu</p>
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/admin" ? path === href : path.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 whitespace-nowrap rounded-xl px-3 font-semibold ${
                  active ? "bg-sand-300 text-navy-950" : "text-ivory-50/80 hover:bg-ivory-50/10 hover:text-ivory-50"
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
