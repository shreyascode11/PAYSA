import { LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { SectorSwitch } from "@/components/admin/SectorSwitch";
import { Logo } from "@/components/Logo";
import { adminPageContext } from "@/lib/admin-context";

const SECTOR_SHORT = { construction: "Construction", college: "College" } as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { org, orgs } = await adminPageContext();
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });
  return (
    <div lang="en" className="theme-admin flex min-h-dvh flex-col lg:flex-row">
      <aside aria-label="Sidebar" className="no-print bg-aurora flex flex-col gap-6 p-4 text-ivory-50 lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:p-5">
        <p className="flex items-center gap-2 text-xl font-extrabold tracking-wide">
          <Logo className="size-8" />
          PAYSA
        </p>
        <AdminNav />
        <form action="/api/auth/logout" method="post" className="lg:mt-auto">
          <button type="submit" className="flex min-h-11 items-center gap-3 rounded-xl px-3 font-semibold text-ivory-50/80 hover:bg-ivory-50/10 hover:text-ivory-50">
            <LogOut aria-hidden="true" className="size-5" />
            Log out
          </button>
        </form>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print glass-light sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <div>
            <p className="font-extrabold text-navy-950">{org.name}</p>
            <p className="text-sm text-navy-950/70">{today}</p>
          </div>
          <SectorSwitch current={org.id} orgs={orgs.map((o) => ({ id: o.id, sector: o.sector, label: SECTOR_SHORT[o.sector] }))} />
        </header>
        <main id="main" className="min-w-0 flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
