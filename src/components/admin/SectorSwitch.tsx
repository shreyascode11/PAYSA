"use client";

import { Building2, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Sector } from "@/lib/types";

interface Props {
  current: string;
  orgs: { id: string; sector: Sector; label: string }[];
}

/** Segmented Construction / College switch in the admin top bar (one demo org per sector). */
export function SectorSwitch({ current, orgs }: Props) {
  const router = useRouter();
  return (
    <div role="group" aria-label="Sector" className="flex rounded-full bg-mint-100 p-1">
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
            className={`flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-bold ${active ? "bg-forest-900 text-cream-50" : "text-ink-900"}`}
          >
            <Icon aria-hidden="true" className="size-4" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
