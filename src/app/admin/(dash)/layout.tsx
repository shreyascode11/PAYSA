import { LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { OrgSwitch } from "@/components/admin/OrgSwitch";
import { adminPageContext } from "@/lib/admin-context";
import { SECTORS } from "@/lib/sectors";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { org, orgs } = await adminPageContext();
  return (
    <div lang="en" className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="no-print flex flex-col gap-4 border-b border-line bg-surface p-4 lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <p className="text-xl font-extrabold text-brand">FairShift · Admin</p>
        <OrgSwitch
          current={org.id}
          orgs={orgs.map((o) => ({ id: o.id, name: o.name, sector: o.sector, sectorLabel: SECTORS[o.sector].label }))}
        />
        <AdminNav />
        <form action="/api/auth/logout" method="post" className="lg:mt-auto">
          <button type="submit" className="flex min-h-11 items-center gap-2 rounded-lg px-3 font-semibold text-muted hover:bg-surface-2">
            <LogOut aria-hidden="true" className="size-5" />
            Log out
          </button>
        </form>
      </aside>
      <main id="main" className="min-w-0 flex-1 p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}
