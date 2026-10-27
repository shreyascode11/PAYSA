"use client";

import { Building2, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Sector } from "@/lib/types";

interface Props {
  current: string;
  orgs: { id: string; name: string; sector: Sector; sectorLabel: string }[];
}

/** Sector switcher: one seeded org per sector so both templates are demoable. */
export function OrgSwitch({ current, orgs }: Props) {
  const router = useRouter();
  return (
    <div role="group" aria-label="Sector" className="flex flex-col gap-1">
      {orgs.map((o) => {
        const Icon = o.sector === "construction" ? Building2 : GraduationCap;
        const active = o.id === current;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            onClick={() => {
              document.cookie = `fs_org=${o.id}; path=/; max-age=31536000; samesite=lax`;
              router.refresh();
            }}
            className={`flex min-h-11 items-center gap-2 rounded-lg px-3 py-1 text-left text-sm font-semibold ${
              active ? "bg-brand text-brand-ink" : "bg-surface-2 text-ink"
            }`}
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" />
            <span className="flex flex-col leading-tight">
              <span>{o.sectorLabel}</span>
              <span className={`text-xs font-normal ${active ? "" : "text-muted"}`}>{o.name}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
