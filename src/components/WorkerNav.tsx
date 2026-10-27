"use client";

import { Award, House, Megaphone, MessageCircle, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/w/home", key: "home", Icon: House },
  { href: "/w/pay", key: "pay", Icon: Wallet },
  { href: "/w/report", key: "report", Icon: Megaphone },
  { href: "/w/voice", key: "voice", Icon: MessageCircle },
  { href: "/w/passport", key: "passport", Icon: Award },
] as const;

export function WorkerNav({ labels, navLabel }: { labels: Record<(typeof ITEMS)[number]["key"], string>; navLabel: string }) {
  const path = usePathname();
  return (
    <nav aria-label={navLabel} className="no-print fixed inset-x-0 bottom-0 z-20 border-t-2 border-line bg-surface">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {ITEMS.map(({ href, key, Icon }) => {
          const active = path === href || (href !== "/w/home" && path.startsWith(href));
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-semibold ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <Icon aria-hidden="true" className={`size-7 ${active ? "stroke-[2.5]" : ""}`} />
                <span className={active ? "underline decoration-2 underline-offset-4" : ""}>{labels[key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
