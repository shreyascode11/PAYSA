"use client";

import { Award, House, Megaphone, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Icons are looked up here because server components can't pass component props to client ones.
const ICONS = { home: House, pay: Wallet, report: Megaphone, passport: Award } as const;
export type PillIcon = keyof typeof ICONS;

export interface PillNavItem {
  href: string;
  label: string;
  icon: PillIcon;
}

function activeIndex(path: string, items: PillNavItem[]): number {
  return items.findIndex((it) => path === it.href || path.startsWith(`${it.href}/`));
}

/** Worker bottom nav: dark pill, orange circle slides to the active tab, label under each icon. */
export function PillNav({ items, label }: { items: PillNavItem[]; label: string }) {
  const path = usePathname();
  const active = activeIndex(path, items);
  const width = 100 / items.length;
  return (
    <nav aria-label={label} className="no-print fixed inset-x-0 bottom-0 z-20 px-3 pb-3">
      <div className="glass-dark relative mx-auto max-w-md rounded-full px-1 py-2 shadow-2xl shadow-ink-900/50">
        {active >= 0 && (
          <span
            aria-hidden="true"
            className="absolute top-2 size-12 rounded-full bg-safety-500 transition-[left] duration-250 ease-out"
            style={{ left: `calc(${active * width + width / 2}% - 1.5rem)` }}
          />
        )}
        <ul className="relative grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map(({ href, label: itemLabel, icon }, i) => {
            const isActive = i === active;
            const Icon = ICONS[icon];
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className="flex min-h-16 flex-col items-center gap-1 rounded-3xl"
                >
                  <span className="flex size-12 items-center justify-center">
                    <Icon aria-hidden="true" className={`size-6 ${isActive ? "text-ink-900" : "text-cream-50/75"}`} strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  <span className={`text-[13px] leading-none ${isActive ? "font-extrabold text-cream-50" : "font-semibold text-cream-50/75"}`}>
                    {itemLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
